import type { ExperienceLevel, GeoPoint, SkillCategory, VerificationStatus } from "../common";

export interface ArtisanSearchFilter {
  category?: SkillCategory;
  near?: GeoPoint;
  radiusKm?: number;
}

/**
 * Candidate as seen by Matching/AI Recommendation services. `trustScore` and
 * `verificationStatus` are User Service's denormalized cache of Trust Service's
 * authoritative record (kept in sync via TrustScoreUpdated/IdentityVerified
 * events) — including them here means ranking never needs a synchronous
 * cross-service call to Trust Service.
 */
export interface ArtisanCandidate {
  artisanId: string;
  userId: string;
  primarySkill: SkillCategory;
  secondarySkills: SkillCategory[];
  experienceLevel: ExperienceLevel;
  serviceRadiusKm: number;
  location: GeoPoint;
  availableNow: boolean;
  verificationStatus: VerificationStatus;
  trustScore: number;
}

export interface HomeownerProfileSummary {
  id: string;
  userId: string;
  fullName: string | null;
  phone: string | null;
}

export interface ArtisanProfileSummary {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  primarySkill: SkillCategory | null;
  serviceRadiusKm: number;
  location: GeoPoint | null;
  verificationStatus: "UNVERIFIED" | "VERIFIED" | "REJECTED";
}

export interface FeaturedArtisan {
  artisanId: string;
  firstName: string | null;
  lastName: string | null;
  primarySkill: SkillCategory;
  experienceLevel: ExperienceLevel;
  city: string | null;
  state: string | null;
  ratingAvg: number;
  ratingCount: number;
  trustScore: number;
}

/** Owns: HomeownerProfile, ArtisanProfile, ArtisanAvailability, PortfolioItem. Does NOT own credentials/passwords (see AuthServicePort) or trust/score data (see TrustServicePort). */
export interface UserServicePort {
  createHomeownerProfile(userId: string, fullName?: string): Promise<string>;
  getHomeownerProfileByUserId(userId: string): Promise<HomeownerProfileSummary | null>;
  getHomeownerProfile(homeownerId: string): Promise<HomeownerProfileSummary | null>;
  createArtisanDraft(userId: string): Promise<string>;
  /** Resolves a NextAuth session's userId to the artisan profile id every other artisan-scoped call needs. */
  getArtisanProfileByUserId(userId: string): Promise<ArtisanProfileSummary | null>;
  updateArtisanOnboardingStep(
    artisanId: string,
    step: number,
    data: Record<string, unknown>,
  ): Promise<void>;
  submitArtisanOnboarding(artisanId: string): Promise<void>;
  getArtisanCandidates(filter: ArtisanSearchFilter): Promise<ArtisanCandidate[]>;
  getArtisanProfile(
    artisanId: string,
    opts?: { includePrivate?: boolean },
  ): Promise<Record<string, unknown> | null>;
  /** Verified, active artisans ranked by trust score — backs the landing page's "Trusted artisans" section. */
  listFeaturedArtisans(limit: number): Promise<FeaturedArtisan[]>;
  updateAvailability(artisanId: string, availability: Record<string, unknown>): Promise<void>;
}
