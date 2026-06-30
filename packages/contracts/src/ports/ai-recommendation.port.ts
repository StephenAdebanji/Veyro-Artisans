import type { GeoPoint, SkillCategory } from "../common";
import type { ArtisanCandidate } from "./user.port";

export interface RecommendationInput {
  serviceRequestId: string;
  category: SkillCategory;
  location: GeoPoint;
  candidates: ArtisanCandidate[];
}

export interface RecommendationBreakdown {
  skillMatch: number;
  distance: number;
  experience: number;
  trust: number;
}

export interface RankedArtisan {
  artisanId: string;
  score: number;
  breakdown: RecommendationBreakdown;
}

/**
 * Stateless ranking over inputs supplied by the caller (Matching Service gathers eligible
 * candidates from User Service + current trust scores, then calls `rank`). No persistent
 * domain data of its own beyond an optional RecommendationLog for evaluation/reproducibility.
 */
export interface AIRecommendationServicePort {
  rank(input: RecommendationInput): Promise<RankedArtisan[]>;
}
