import type { Prisma, SkillCategory } from "@prisma/client";
import { prisma } from "@/platform/prisma";

export const userRepository = {
  async createHomeownerProfile(userId: string, fullName?: string) {
    return prisma.homeownerProfile.create({ data: { userId, fullName } });
  },

  async findHomeownerProfile(id: string) {
    return prisma.homeownerProfile.findUnique({ where: { id } });
  },

  async findHomeownerProfileByUserId(userId: string) {
    return prisma.homeownerProfile.findUnique({ where: { userId } });
  },

  async updateHomeownerProfile(
    userId: string,
    data: { fullName?: string; phone?: string; address?: string; city?: string; state?: string; profilePhotoUrl?: string },
  ) {
    return prisma.homeownerProfile.update({ where: { userId }, data });
  },

  async createArtisanDraft(userId: string) {
    return prisma.artisanProfile.create({ data: { userId } });
  },

  async findArtisanProfileByUserId(userId: string) {
    return prisma.artisanProfile.findUnique({ where: { userId } });
  },

  async findArtisanProfile(artisanId: string) {
    return prisma.artisanProfile.findUnique({
      where: { id: artisanId },
      include: { availability: true, portfolio: true },
    });
  },

  async updateArtisanProfile(artisanId: string, data: Prisma.ArtisanProfileUpdateInput) {
    return prisma.artisanProfile.update({ where: { id: artisanId }, data });
  },

  async setOnboardingStep(artisanId: string, step: number) {
    return prisma.artisanProfile.update({
      where: { id: artisanId },
      data: { onboardingStep: step },
    });
  },

  async submitOnboarding(artisanId: string) {
    return prisma.artisanProfile.update({
      where: { id: artisanId },
      data: { onboardingStatus: "PENDING_REVIEW" },
    });
  },

  async replacePortfolio(
    artisanId: string,
    items: Array<{ beforeUrl?: string; afterUrl?: string; caption?: string }>,
  ) {
    await prisma.portfolioItem.deleteMany({ where: { artisanId } });
    if (items.length === 0) return;
    await prisma.portfolioItem.createMany({
      data: items.map((item) => ({ artisanId, ...item })),
    });
  },

  async upsertAvailability(
    artisanId: string,
    data: {
      workingDays?: string[];
      startTime?: string;
      endTime?: string;
      emergencyAvailable?: boolean;
    },
  ) {
    return prisma.artisanAvailability.upsert({
      where: { artisanId },
      create: {
        artisanId,
        workingDays: data.workingDays ?? [],
        startTime: data.startTime,
        endTime: data.endTime,
        emergencyAvailable: data.emergencyAvailable ?? false,
      },
      update: data,
    });
  },

  async searchActiveArtisans(category?: SkillCategory) {
    return prisma.artisanProfile.findMany({
      where: {
        onboardingStatus: "ACTIVE",
        ...(category ? { OR: [{ primarySkill: category }, { secondarySkills: { has: category } }] } : {}),
      },
      include: { availability: true },
    });
  },

  async listFeatured(limit: number) {
    return prisma.artisanProfile.findMany({
      where: { onboardingStatus: "ACTIVE", verificationStatus: "VERIFIED" },
      orderBy: { trustScore: "desc" },
      take: limit,
    });
  },

  async countVerifiedArtisans() {
    return prisma.artisanProfile.count({ where: { verificationStatus: "VERIFIED" } });
  },

  async countAllHomeowners() {
    return prisma.homeownerProfile.count();
  },

  async countAllArtisans() {
    return prisma.artisanProfile.count();
  },

  async listAllArtisans() {
    return prisma.artisanProfile.findMany({
      include: { availability: true, portfolio: true, user: { select: { email: true, status: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async listAllHomeowners() {
    return prisma.homeownerProfile.findMany({
      include: { user: { select: { email: true, status: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async findArtisanProfileFull(artisanId: string) {
    return prisma.artisanProfile.findUnique({
      where: { id: artisanId },
      include: { availability: true, portfolio: true, user: { select: { email: true, status: true, role: true, createdAt: true } } },
    });
  },

  async findHomeownerProfileFull(homeownerId: string) {
    return prisma.homeownerProfile.findUnique({
      where: { id: homeownerId },
      include: { user: { select: { email: true, status: true, role: true, createdAt: true } } },
    });
  },

  async suspendUser(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  },

  async activateUser(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  },

  async deleteArtisan(artisanId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id: artisanId }, select: { userId: true } });
    if (profile) await prisma.user.update({ where: { id: profile.userId }, data: { status: "SUSPENDED" } });
    await prisma.artisanProfile.delete({ where: { id: artisanId } });
  },

  async deleteHomeowner(homeownerId: string) {
    const profile = await prisma.homeownerProfile.findUnique({ where: { id: homeownerId }, select: { userId: true } });
    if (profile) await prisma.user.update({ where: { id: profile.userId }, data: { status: "SUSPENDED" } });
    await prisma.homeownerProfile.delete({ where: { id: homeownerId } });
  },
};
