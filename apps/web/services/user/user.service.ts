import type { SkillCategory as DbSkillCategory } from "@prisma/client";
import type {
  ArtisanCandidate,
  ArtisanProfileSummary,
  ArtisanSearchFilter,
  FeaturedArtisan,
  HomeownerProfileSummary,
  SkillCategory,
  UserServicePort,
  VerificationStatus,
} from "@veyro/contracts";
import { isAvailableNow } from "./availability";
import { EXPERIENCE_FROM_DB, EXPERIENCE_TO_DB } from "./experience-level.map";
import { userRepository } from "./user.repository";

/** Owns: HomeownerProfile, ArtisanProfile, ArtisanAvailability, PortfolioItem.
 * Does NOT own credentials/passwords (Auth Service) or trust/score data (Trust
 * Service) — verificationStatus/trustScore below are this service's own cache,
 * synced via events (see services/user/user.events would live here if this
 * service subscribed to anything; today it only ever reads its own cache). */
class UserService implements UserServicePort {
  async createHomeownerProfile(userId: string, fullName?: string): Promise<string> {
    const profile = await userRepository.createHomeownerProfile(userId, fullName);
    return profile.id;
  }

  async getHomeownerProfileByUserId(userId: string): Promise<HomeownerProfileSummary | null> {
    const profile = await userRepository.findHomeownerProfileByUserId(userId);
    return profile ? { id: profile.id, userId: profile.userId, fullName: profile.fullName } : null;
  }

  async getHomeownerProfile(homeownerId: string): Promise<HomeownerProfileSummary | null> {
    const profile = await userRepository.findHomeownerProfile(homeownerId);
    return profile ? { id: profile.id, userId: profile.userId, fullName: profile.fullName } : null;
  }

  async createArtisanDraft(userId: string): Promise<string> {
    const profile = await userRepository.createArtisanDraft(userId);
    return profile.id;
  }

  async getArtisanProfileByUserId(userId: string): Promise<ArtisanProfileSummary | null> {
    const profile = await userRepository.findArtisanProfileByUserId(userId);
    if (!profile) return null;

    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      primarySkill: profile.primarySkill as SkillCategory | null,
      serviceRadiusKm: profile.serviceRadiusKm,
      location: profile.gpsLat !== null && profile.gpsLng !== null ? { lat: profile.gpsLat, lng: profile.gpsLng } : null,
    };
  }

  async updateArtisanOnboardingStep(
    artisanId: string,
    step: number,
    data: Record<string, unknown>,
  ): Promise<void> {
    switch (step) {
      case 1: {
        await userRepository.updateArtisanProfile(artisanId, {
          firstName: asString(data.firstName),
          lastName: asString(data.lastName),
        });
        break;
      }
      case 2: {
        await userRepository.updateArtisanProfile(artisanId, {
          profilePhotoUrl: asString(data.profilePhotoUrl),
          primarySkill: asString(data.primarySkill) as DbSkillCategory | undefined,
          secondarySkills: (data.secondarySkills as string[] | undefined) ?? undefined,
          experienceLevel: data.experienceLevel
            ? EXPERIENCE_TO_DB[data.experienceLevel as keyof typeof EXPERIENCE_TO_DB]
            : undefined,
          serviceRadiusKm: data.serviceRadiusKm as number | undefined,
          bio: asString(data.bio),
        });
        break;
      }
      case 3: {
        await userRepository.updateArtisanProfile(artisanId, {
          country: asString(data.country),
          state: asString(data.state),
          city: asString(data.city),
          lga: asString(data.lga),
          residentialAddress: asString(data.residentialAddress),
          gpsLat: data.gpsLat as number | undefined,
          gpsLng: data.gpsLng as number | undefined,
        });
        break;
      }
      case 7: {
        const items = Array.isArray(data.items)
          ? (data.items as Array<{ beforeUrl?: string; afterUrl?: string; caption?: string }>)
          : [];
        await userRepository.replacePortfolio(artisanId, items);
        break;
      }
      case 8: {
        await userRepository.upsertAvailability(artisanId, {
          workingDays: data.workingDays as string[] | undefined,
          startTime: asString(data.startTime),
          endTime: asString(data.endTime),
          emergencyAvailable: data.emergencyAvailable as boolean | undefined,
        });
        break;
      }
      default:
        // Steps 4-6 (ID, proof of address, credentials) are uploads owned by
        // Trust Service — the API gateway route calls trustService.submitCredential
        // directly for those steps, in addition to this method (which only ever
        // advances the onboardingStep counter for them).
        break;
    }

    await userRepository.setOnboardingStep(artisanId, step);
  }

  async submitArtisanOnboarding(artisanId: string): Promise<void> {
    await userRepository.submitOnboarding(artisanId);
  }

  async getArtisanCandidates(filter: ArtisanSearchFilter): Promise<ArtisanCandidate[]> {
    const rows = await userRepository.searchActiveArtisans(filter.category as DbSkillCategory | undefined);

    return rows
      .filter((row) => row.primarySkill !== null && row.gpsLat !== null && row.gpsLng !== null)
      .map((row) => ({
        artisanId: row.id,
        userId: row.userId,
        primarySkill: row.primarySkill as SkillCategory,
        secondarySkills: row.secondarySkills as SkillCategory[],
        experienceLevel: row.experienceLevel ? EXPERIENCE_FROM_DB[row.experienceLevel] : "0-2",
        serviceRadiusKm: row.serviceRadiusKm,
        location: { lat: row.gpsLat as number, lng: row.gpsLng as number },
        availableNow: isAvailableNow(row.availability),
        verificationStatus: row.verificationStatus as VerificationStatus,
        trustScore: row.trustScore,
      }));
  }

  async getArtisanProfile(
    artisanId: string,
    opts?: { includePrivate?: boolean },
  ): Promise<Record<string, unknown> | null> {
    const profile = await userRepository.findArtisanProfile(artisanId);
    if (!profile) return null;

    if (opts?.includePrivate) {
      return { ...profile };
    }

    const { residentialAddress, gpsLat, gpsLng, ...publicProfile } = profile;
    void residentialAddress;
    void gpsLat;
    void gpsLng;
    return publicProfile;
  }

  async listFeaturedArtisans(limit: number): Promise<FeaturedArtisan[]> {
    const rows = await userRepository.listFeatured(limit);
    return rows
      .filter((row): row is typeof row & { primarySkill: DbSkillCategory } => row.primarySkill !== null)
      .map((row) => ({
        artisanId: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        primarySkill: row.primarySkill as SkillCategory,
        experienceLevel: row.experienceLevel ? EXPERIENCE_FROM_DB[row.experienceLevel] : "0-2",
        city: row.city,
        state: row.state,
        ratingAvg: row.ratingAvg,
        ratingCount: row.ratingCount,
        trustScore: row.trustScore,
      }));
  }

  async updateAvailability(artisanId: string, availability: Record<string, unknown>): Promise<void> {
    await userRepository.upsertAvailability(artisanId, {
      workingDays: availability.workingDays as string[] | undefined,
      startTime: asString(availability.startTime),
      endTime: asString(availability.endTime),
      emergencyAvailable: availability.emergencyAvailable as boolean | undefined,
    });
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const userService = new UserService();
