import type { Prisma, SkillCategory } from "@prisma/client";
import { prisma } from "@/platform/prisma";

export const userRepository = {
  async createHomeownerProfile(
    userId: string,
    fullName?: string,
    phone?: string,
    location?: { address?: string; city?: string; state?: string },
  ) {
    return prisma.homeownerProfile.create({
      data: { userId, fullName, phone, address: location?.address, city: location?.city, state: location?.state },
    });
  },

  async findHomeownerProfile(id: string) {
    return prisma.homeownerProfile.findUnique({ where: { id } });
  },

  async findHomeownerProfileByUserId(userId: string) {
    return prisma.homeownerProfile.findUnique({ where: { userId } });
  },

  async updateHomeownerProfile(
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      profilePhotoUrl?: string;
    },
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
      include: { availability: true, portfolio: true, user: { select: { email: true, phone: true } } },
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
      include: { availability: true, portfolio: true, user: { select: { email: true, status: true, role: true, createdAt: true, deleteReason: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async listAllHomeowners() {
    return prisma.homeownerProfile.findMany({
      include: { user: { select: { email: true, status: true, role: true, createdAt: true, deleteReason: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async findArtisanProfileFull(artisanId: string) {
    return prisma.artisanProfile.findUnique({
      where: { id: artisanId },
      include: { availability: true, portfolio: true, user: { select: { email: true, status: true, role: true, createdAt: true, deleteReason: true } } },
    });
  },

  async findHomeownerProfileFull(homeownerId: string) {
    return prisma.homeownerProfile.findUnique({
      where: { id: homeownerId },
      include: { user: { select: { email: true, status: true, role: true, createdAt: true, deleteReason: true } } },
    });
  },

  async suspendUser(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  },

  async activateUser(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  },

  async deleteArtisan(artisanId: string, reason: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id: artisanId }, select: { userId: true } });
    if (profile) {
      await prisma.user.update({
        where: { id: profile.userId },
        data: { status: "DELETED", deleteReason: reason },
      });
    }
  },

  async deleteHomeowner(homeownerId: string, reason: string) {
    const profile = await prisma.homeownerProfile.findUnique({ where: { id: homeownerId }, select: { userId: true } });
    if (profile) {
      await prisma.user.update({
        where: { id: profile.userId },
        data: { status: "DELETED", deleteReason: reason },
      });
    }
  },

  async updateUserPhoneByArtisanId(artisanId: string, phone: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id: artisanId }, select: { userId: true } });
    if (!profile) return;
    return prisma.user.update({ where: { id: profile.userId }, data: { phone } });
  },

  async deleteHomeownerProfileByUserId(userId: string) {
    const profile = await prisma.homeownerProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return;
    await prisma.homeownerProfile.delete({ where: { userId } });
  },

  async deleteArtisanProfileByUserId(userId: string): Promise<string | null> {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return null;
    await prisma.portfolioItem.deleteMany({ where: { artisanId: profile.id } });
    await prisma.artisanAvailability.deleteMany({ where: { artisanId: profile.id } });
    await prisma.artisanProfile.delete({ where: { id: profile.id } });
    return profile.id;
  },
};
