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

  async completeJob(id: string) {
    return prisma.job.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
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
      include: { matches: { where: { status: "ACCEPTED" }, take: 1 } },
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
    return prisma.job.count({ where: { artisanId, status: "ACTIVE" } });
  },

  async countDisputesForArtisan(artisanId: string) {
    return prisma.dispute.count({ where: { job: { artisanId } } });
  },

  async listOpenDisputes() {
    return prisma.dispute.findMany({
      where: { status: "OPEN" },
      include: { job: { select: { artisanId: true, homeownerId: true, agreedPrice: true } } },
      orderBy: { createdAt: "desc" },
    });
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
};
