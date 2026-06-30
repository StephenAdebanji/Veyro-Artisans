import type {
  ArtisanCandidate,
  ExperienceLevel,
  GeoPoint,
  RecommendationBreakdown,
  SkillCategory,
} from "@veyro/contracts";
import { haversineKm } from "@/platform/geo";

/**
 * Recommendation formula — refined from the brief's:
 *   score = 0.35*SkillMatch + 0.20*Distance + 0.15*Experience + 0.30*TrustScore
 *
 * The weights are kept exactly as specified (they sum to 1.0). What changes is
 * how each term is computed, since the brief's terms aren't all on a comparable
 * [0,1] scale on their own:
 *
 * - skillMatch: partial credit. 1.0 for a primary-skill match, 0.6 for a
 *   secondary-skill match (eligibility.ts already guarantees one of the two).
 * - distance: normalized against the ARTISAN'S OWN declared service radius,
 *   not a fixed cutoff — `1 - distanceKm/serviceRadiusKm`, clamped to [0,1]. An
 *   artisan who travels further by choice isn't penalized the same as one who
 *   only serves a tight radius.
 * - experience: ExperienceLevel buckets mapped to [0,1] rather than raw years.
 * - trust: TrustScore is already 0-100 and already a composite of verification,
 *   ratings, reviews, completion rate and response time (see
 *   services/trust/trust-score-engine.ts) — it's used here as a single term so
 *   those sub-factors are never double-counted against this formula's own
 *   weights.
 */
export const RECOMMENDATION_WEIGHTS = {
  skillMatch: 0.35,
  distance: 0.2,
  experience: 0.15,
  trust: 0.3,
} as const;

const EXPERIENCE_SCORE: Record<ExperienceLevel, number> = {
  "0-2": 0.25,
  "3-5": 0.5,
  "6-10": 0.75,
  "10+": 1,
};

export function scoreSkillMatch(candidate: ArtisanCandidate, category: SkillCategory): number {
  if (candidate.primarySkill === category) return 1;
  if (candidate.secondarySkills.includes(category)) return 0.6;
  return 0;
}

export function scoreDistance(candidate: ArtisanCandidate, requestLocation: GeoPoint): number {
  const distanceKm = haversineKm(candidate.location, requestLocation);
  return clamp01(1 - distanceKm / candidate.serviceRadiusKm);
}

export function scoreExperience(candidate: ArtisanCandidate): number {
  return EXPERIENCE_SCORE[candidate.experienceLevel];
}

export function scoreTrust(candidate: ArtisanCandidate): number {
  return clamp01(candidate.trustScore / 100);
}

export function scoreCandidate(
  candidate: ArtisanCandidate,
  category: SkillCategory,
  requestLocation: GeoPoint,
): { score: number; breakdown: RecommendationBreakdown } {
  const breakdown: RecommendationBreakdown = {
    skillMatch: scoreSkillMatch(candidate, category),
    distance: scoreDistance(candidate, requestLocation),
    experience: scoreExperience(candidate),
    trust: scoreTrust(candidate),
  };

  const score =
    RECOMMENDATION_WEIGHTS.skillMatch * breakdown.skillMatch +
    RECOMMENDATION_WEIGHTS.distance * breakdown.distance +
    RECOMMENDATION_WEIGHTS.experience * breakdown.experience +
    RECOMMENDATION_WEIGHTS.trust * breakdown.trust;

  return { score, breakdown };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
