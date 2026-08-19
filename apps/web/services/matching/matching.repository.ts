import type { SkillCategory } from "@prisma/client";
import { prisma } from "@/platform/prisma";

export const MATCH_WINDOW_MS = 10 * 60 * 1000; // must match matching-screen.tsx

export const matchingRepository = {
  async createServiceRequest(data: {
    homeownerId: string;
    category: SkillCategory;
    description: string;
    lat: number;
    lng: number;
    address: string;
    budgetMin?: number;
    budgetMax?: number;
    preferredDate?: Date;
  }) {
    return prisma.serviceRequest.create({ data });
  },

  async findServiceRequest(id: string) {
    return prisma.serviceRequest.findUnique({ where: { id } });
  },

  async updateServiceRequestStatus(
    id: string,
    status: "SEARCHING" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  ) {
    return prisma.serviceRequest.update({ where: { id }, data: { status } });
  },

  async createMatch(data: {
    serviceRequestId: string;
    artisanId: string;
    proposedPrice: number;
    etaMinutes: number;
    distanceKm: number;
  }) {
    return prisma.match.create({ data });
  },

  async findMatch(id: string) {
    return prisma.match.findUnique({ where: { id } });
  },

  async listMatchesForRequest(serviceRequestId: string) {
    return prisma.match.findMany({ where: { serviceRequestId }, orderBy: { createdAt: "asc" } });
  },

  async updateMatchStatus(id: string, status: "ACCEPTED" | "DECLINED", declineReason?: string) {
    return prisma.match.update({
      where: { id },
      data: { status, respondedAt: new Date(), ...(declineReason ? { declineReason } : {}) },
    });
  },

  async expirePendingMatches(serviceRequestId: string, exceptMatchId: string) {
    return prisma.match.updateMany({
      where: { serviceRequestId, id: { not: exceptMatchId }, status: "PENDING" },
      data: { status: "EXPIRED" },
    });
  },

  async createJob(data: {
    serviceRequestId: string;
    matchId: string;
    artisanId: string;
    homeownerId: string;
    agreedPrice: number;
  }) {
    return prisma.job.create({ data });
  },

  async findJob(id: string) {
    return prisma.job.findUnique({ where: { id } });
  },

  async findJobByServiceRequestId(serviceRequestId: string) {
    return prisma.job.findUnique({ where: { serviceRequestId } });
  },

  async updateJobStatus(id: string, status: "IN_PROGRESS" | "COMPLETED") {
    if (status === "COMPLETED") {
      return prisma.job.update({
        where: { id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }
    await prisma.$executeRaw`
      UPDATE "matching"."Job"
      SET "status" = 'IN_PROGRESS', "inProgressAt" = NOW()
      WHERE "id" = ${id}
    `;
    return prisma.job.findUniqueOrThrow({ where: { id } });
  },

  async completeJob(id: string) {
    return prisma.job.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  },

  async findJobByIdForHomeowner(jobId: string, homeownerId: string) {
    return prisma.job.findFirst({
      where: { id: jobId, homeownerId },
      include: { serviceRequest: true, review: true },
    });
  },

  async listCompletedJobsForHomeowner(homeownerId: string) {
    return prisma.job.findMany({
      where: { homeownerId, status: "COMPLETED" },
      include: { serviceRequest: true, review: { select: { id: true, rating: true } } },
      orderBy: { completedAt: "desc" },
    });
  },

  async createReview(data: {
    jobId: string;
    homeownerId: string;
    artisanId: string;
    rating: number;
    comment?: string;
    verificationHash: string;
  }) {
    return prisma.review.create({ data });
  },

  async listActiveRequestsForHomeowner(homeownerId: string) {
    // A SEARCHING request past the offer window is functionally expired even
    // if its DB status hasn't been swept to CANCELLED yet (the cron sweep
    // runs on its own cadence) — checked here too so the dashboard never
    // shows a dead "Awaiting matches" card waiting on that sweep.
    const windowStart = new Date(Date.now() - MATCH_WINDOW_MS);
    return prisma.serviceRequest.findMany({
      where: {
        homeownerId,
        OR: [
          { status: "SEARCHING", createdAt: { gte: windowStart } },
          { status: { in: ["MATCHED", "IN_PROGRESS"] } },
        ],
      },
      include: {
        matches: { where: { status: "ACCEPTED" }, take: 1 },
        job: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async listReviewsForArtisan(artisanId: string) {
    return prisma.review.findMany({
      where: { artisanId },
      orderBy: { createdAt: "desc" },
      include: { job: { include: { serviceRequest: { select: { description: true } } } } },
    });
  },

  async listReviewsByHomeowner(homeownerId: string) {
    return prisma.review.findMany({
      where: { homeownerId },
      orderBy: { createdAt: "desc" },
      include: { job: { include: { serviceRequest: { select: { description: true } } } } },
    });
  },

  async countCompletedRequestsForHomeowner(homeownerId: string) {
    return prisma.serviceRequest.count({ where: { homeownerId, status: "COMPLETED" } });
  },

  async cancelServiceRequest(serviceRequestId: string) {
    await prisma.match.updateMany({
      where: { serviceRequestId, status: "PENDING" },
      data: { status: "EXPIRED" },
    });
    return prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { status: "CANCELLED" },
    });
  },

  async expireStaleRequests(): Promise<number> {
    const cutoff = new Date(Date.now() - MATCH_WINDOW_MS);
    const stale = await prisma.serviceRequest.findMany({
      where: { status: "SEARCHING", createdAt: { lt: cutoff } },
      select: { id: true },
    });
    if (stale.length === 0) return 0;
    const ids = stale.map((r) => r.id);
    await prisma.match.updateMany({
      where: { serviceRequestId: { in: ids }, status: "PENDING" },
      data: { status: "EXPIRED" },
    });
    await prisma.serviceRequest.updateMany({
      where: { id: { in: ids } },
      data: { status: "CANCELLED" },
    });
    return stale.length;
  },

  async listSearchingRequests(category: SkillCategory, excludeArtisanId: string) {
    const windowStart = new Date(Date.now() - MATCH_WINDOW_MS);
    return prisma.serviceRequest.findMany({
      where: {
        category,
        // MATCHED means at least one offer arrived — still open for more bids
        // until the homeowner explicitly accepts one.
        status: { in: ["SEARCHING", "MATCHED"] },
        createdAt: { gte: windowStart },
        // Exclude only if artisan has an active (non-declined) match — DECLINED means they can re-offer.
        matches: { none: { artisanId: excludeArtisanId, status: { in: ["PENDING", "ACCEPTED", "EXPIRED"] } } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async createJobInvite(serviceRequestId: string, artisanId: string) {
    await prisma.jobInvite.upsert({
      where: { serviceRequestId_artisanId: { serviceRequestId, artisanId } },
      create: { serviceRequestId, artisanId },
      update: {},
    });
  },

  /** Requests this artisan was directly invited to, still within the same
   * SEARCHING + offer-window bounds as the generic feed — bypasses category
   * and radius since a deliberate homeowner pick overrides those. */
  async listInvitedRequests(artisanId: string) {
    const windowStart = new Date(Date.now() - MATCH_WINDOW_MS);
    const invites = await prisma.jobInvite.findMany({
      where: { artisanId },
      select: { serviceRequestId: true },
    });
    if (invites.length === 0) return [];
    return prisma.serviceRequest.findMany({
      where: {
        id: { in: invites.map((i) => i.serviceRequestId) },
        status: "SEARCHING",
        createdAt: { gte: windowStart },
        matches: { none: { artisanId, status: { in: ["PENDING", "ACCEPTED", "EXPIRED"] } } },
      },
    });
  },

  /** Artisan ids the homeowner has already invited on this request — backs the
   * "Invited ✓" state on the matching screen's AI panel so it survives a
   * reload/logout instead of only living in client state. */
  async listInvitedArtisanIds(serviceRequestId: string) {
    const invites = await prisma.jobInvite.findMany({
      where: { serviceRequestId },
      select: { artisanId: true },
    });
    return invites.map((i) => i.artisanId);
  },

  async listPendingMatchesForArtisan(artisanId: string) {
    return prisma.match.findMany({
      where: { artisanId, status: "PENDING", serviceRequest: { status: { not: "CANCELLED" } } },
      include: { serviceRequest: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async listJobsForArtisan(artisanId: string) {
    return prisma.job.findMany({
      where: { artisanId },
      include: { serviceRequest: true },
      orderBy: { startedAt: "desc" },
    });
  },

  async listRecentlyDeclinedMatchesForArtisan(artisanId: string) {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return prisma.match.findMany({
      where: { artisanId, status: "DECLINED", respondedAt: { gte: cutoff } },
      include: { serviceRequest: { select: { description: true } } },
      orderBy: { respondedAt: "desc" },
    });
  },

  async findPendingMatchForArtisan(matchId: string, artisanId: string) {
    return prisma.match.findFirst({
      where: { id: matchId, artisanId, status: "PENDING" },
      include: { serviceRequest: true },
    });
  },

  async findMatchForArtisan(matchId: string, artisanId: string) {
    return prisma.match.findFirst({
      where: { id: matchId, artisanId },
      include: { serviceRequest: true },
    });
  },

  async findJobForArtisan(jobId: string, artisanId: string) {
    return prisma.job.findFirst({
      where: { id: jobId, artisanId },
      include: { serviceRequest: true, review: true },
    });
  },

  async findJobByMatchId(matchId: string, artisanId: string) {
    return prisma.job.findFirst({
      where: { matchId, artisanId },
      include: { serviceRequest: true, review: true },
    });
  },

  async findConversationByJob(jobId: string) {
    return prisma.conversation.findFirst({ where: { jobId } });
  },

  async countActiveJobsForArtisan(artisanId: string) {
    // Use raw SQL so the count works both before and after the IN_PROGRESS migration.
    const rows = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::int AS count FROM "matching"."Job"
      WHERE "artisanId" = ${artisanId}
        AND "status"::text IN ('ACTIVE', 'IN_PROGRESS')
    `;
    return Number(rows[0]?.count ?? 0);
  },

  async countDisputesForArtisan(artisanId: string) {
    return prisma.dispute.count({ where: { job: { artisanId } } });
  },

  async listOpenDisputes() {
    const disputes = await prisma.dispute.findMany({
      where: { status: "OPEN" },
      include: { job: { select: { artisanId: true, homeownerId: true, agreedPrice: true } } },
      orderBy: { createdAt: "desc" },
    });

    const userIds = [...new Set(disputes.map((d) => d.raisedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        role: true,
        artisanProfile: { select: { firstName: true, lastName: true } },
        homeownerProfile: { select: { fullName: true } },
      },
    });
    const userMap = new Map(
      users.map((u) => {
        const name =
          (u.artisanProfile
            ? [u.artisanProfile.firstName, u.artisanProfile.lastName].filter(Boolean).join(" ")
            : u.homeownerProfile?.fullName) || null;
        return [u.id, { id: u.id, name, email: u.email, role: u.role }];
      }),
    );

    return disputes.map((d) => ({
      ...d,
      raisedByUser: userMap.get(d.raisedBy) ?? null,
    }));
  },

  async resolveDispute(id: string, resolution: string) {
    return prisma.dispute.update({
      where: { id },
      data: { status: "RESOLVED", resolution, resolvedAt: new Date() },
    });
  },

  async countOpenDisputes() {
    return prisma.dispute.count({ where: { status: "OPEN" } });
  },

  async countAllServiceRequests() {
    return prisma.serviceRequest.count({ where: { status: { in: ["SEARCHING", "MATCHED"] } } });
  },

  async listJobsHistoryForArtisan(artisanId: string) {
    return prisma.job.findMany({
      where: { artisanId, status: { in: ["ACTIVE", "IN_PROGRESS", "COMPLETED", "DISPUTED"] } },
      include: { serviceRequest: true },
      orderBy: { startedAt: "desc" },
    });
  },

  async listJobsHistoryForHomeowner(homeownerId: string) {
    return prisma.job.findMany({
      where: { homeownerId, status: { in: ["ACTIVE", "IN_PROGRESS", "COMPLETED", "DISPUTED"] } },
      include: { serviceRequest: true },
      orderBy: { startedAt: "desc" },
    });
  },

  async listAllJobsHistory() {
    return prisma.job.findMany({
      where: { status: { in: ["ACTIVE", "IN_PROGRESS", "COMPLETED", "DISPUTED"] } },
      include: { serviceRequest: true },
      orderBy: { startedAt: "desc" },
    });
  },
};
