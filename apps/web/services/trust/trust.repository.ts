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

  async resetCredentialsForArtisan(artisanId: string) {
    return prisma.credential.updateMany({
      where: { artisanId },
      data: { status: "PENDING", reviewedBy: null, reviewedAt: null },
    });
  },

  async massUpdateCredentials(artisanId: string, status: "APPROVED" | "REJECTED", reviewedBy: string) {
    return prisma.credential.updateMany({
      where: { artisanId, status: "PENDING" },
      data: { status, reviewedBy, reviewedAt: new Date() },
    });
  },

  async countApprovedCredentials(artisanId: string): Promise<number> {
    return prisma.credential.count({ where: { artisanId, status: "APPROVED" } });
  },

  async listCredentialTypes(artisanId: string): Promise<CredentialType[]> {
    const rows = await prisma.credential.findMany({ where: { artisanId }, select: { type: true } });
    return rows.map((r) => r.type);
  },

  async listPending() {
    // Drive the queue from artisan status, not credential status.
    // An artisan stays in the queue until a final decision is recorded on their profile.
    const artisans = await prisma.artisanProfile.findMany({
      where: { onboardingStatus: "PENDING_REVIEW", verificationStatus: "UNVERIFIED" },
      select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } },
    });

    if (artisans.length === 0) return [];

    const artisanMap = new Map(artisans.map((a) => [a.id, a]));

    // Credential is in the `trust` schema with no Prisma relation to ArtisanProfile,
    // so fetch credentials separately and join in memory.
    const credentials = await prisma.credential.findMany({
      where: { artisanId: { in: [...artisanMap.keys()] } },
      orderBy: { createdAt: "asc" },
    });

    return credentials.map((c) => ({
      ...c,
      artisan: artisanMap.get(c.artisanId) ?? null,
    }));
  },

  async countPending(): Promise<number> {
    return prisma.artisanProfile.count({
      where: { onboardingStatus: "PENDING_REVIEW", verificationStatus: "UNVERIFIED" },
    });
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
