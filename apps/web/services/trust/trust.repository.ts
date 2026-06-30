import type { CredentialStatus, CredentialType, Prisma, TrustScoreSource } from "@prisma/client";
import type { TrustScoreBreakdown } from "@veyro/contracts";
import { prisma } from "@/platform/prisma";

export const trustRepository = {
  async createCredential(data: { artisanId: string; type: CredentialType; fileUrl: string }) {
    return prisma.credential.create({ data });
  },

  async findCredential(credentialId: string) {
    return prisma.credential.findUnique({ where: { id: credentialId } });
  },

  async updateCredentialStatus(credentialId: string, status: CredentialStatus, reviewedBy: string) {
    return prisma.credential.update({
      where: { id: credentialId },
      data: { status, reviewedBy, reviewedAt: new Date() },
    });
  },

  async countApprovedCredentials(artisanId: string): Promise<number> {
    return prisma.credential.count({ where: { artisanId, status: "APPROVED" } });
  },

  async listPending() {
    return prisma.credential.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } });
  },

  async countPending(): Promise<number> {
    return prisma.credential.count({ where: { status: "PENDING" } });
  },

  async getOrCreateTrustProfile(artisanId: string) {
    const existing = await prisma.trustProfile.findUnique({ where: { artisanId } });
    if (existing) return existing;
    return prisma.trustProfile.create({ data: { artisanId } });
  },

  async updateTrustProfile(
    artisanId: string,
    data: Partial<{
      verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
      trustScore: number;
      ratingAvg: number;
      ratingCount: number;
      totalJobsAccepted: number;
      completedJobs: number;
      responseTimeAvgSeconds: number;
    }>,
  ) {
    return prisma.trustProfile.update({ where: { artisanId }, data });
  },

  async incrementTrustProfileCounters(
    artisanId: string,
    delta: { totalJobsAccepted?: number; completedJobs?: number },
  ) {
    return prisma.trustProfile.update({
      where: { artisanId },
      data: {
        totalJobsAccepted: delta.totalJobsAccepted ? { increment: delta.totalJobsAccepted } : undefined,
        completedJobs: delta.completedJobs ? { increment: delta.completedJobs } : undefined,
      },
    });
  },

  async recordScoreHistory(
    trustProfileId: string,
    score: number,
    breakdown: TrustScoreBreakdown,
    source: TrustScoreSource,
  ) {
    return prisma.trustScoreHistory.create({
      data: {
        trustProfileId,
        score,
        breakdown: breakdown as unknown as Prisma.InputJsonValue,
        source,
      },
    });
  },

  async listScoreHistory(artisanId: string) {
    const profile = await prisma.trustProfile.findUnique({
      where: { artisanId },
      include: { history: { orderBy: { createdAt: "desc" } } },
    });
    return profile?.history ?? [];
  },
};
