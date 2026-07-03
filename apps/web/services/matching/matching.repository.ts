import type { SkillCategory } from "@prisma/client";
import { prisma } from "@/platform/prisma";

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

  async updateMatchStatus(id: string, status: "ACCEPTED" | "DECLINED") {
    return prisma.match.update({ where: { id }, data: { status, respondedAt: new Date() } });
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
    return prisma.serviceRequest.findMany({
      where: { homeownerId, status: { in: ["SEARCHING", "MATCHED", "IN_PROGRESS"] } },
      include: {
        matches: { where: { status: "ACCEPTED" }, take: 1 },
        job: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async listReviewsForArtisan(artisanId: string) {
    return prisma.review.findMany({ where: { artisanId }, orderBy: { createdAt: "desc" } });
  },

  async countCompletedRequestsForHomeowner(homeownerId: string) {
    return prisma.serviceRequest.count({ where: { homeownerId, status: "COMPLETED" } });
  },

  async listSearchingRequests(category: SkillCategory, excludeArtisanId: string) {
    return prisma.serviceRequest.findMany({
      where: { category, status: "SEARCHING", matches: { none: { artisanId: excludeArtisanId } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async listPendingMatchesForArtisan(artisanId: string) {
    return prisma.match.findMany({
      where: { artisanId, status: "PENDING" },
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

  async findPendingMatchForArtisan(matchId: string, artisanId: string) {
    return prisma.match.findFirst({
      where: { id: matchId, artisanId, status: "PENDING" },
      include: { serviceRequest: true },
    });
  },

  async findJobForArtisan(jobId: string, artisanId: string) {
    return prisma.job.findFirst({
      where: { id: jobId, artisanId },
      include: { serviceRequest: true },
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
