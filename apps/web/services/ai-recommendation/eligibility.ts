import type { ArtisanCandidate, GeoPoint, SkillCategory } from "@veyro/contracts";
import { haversineKm } from "@/platform/geo";

export interface EligibilityContext {
  category: SkillCategory;
  location: GeoPoint;
}

/**
 * Hard gates, applied before scoring — pass/fail, never blended into the weighted
 * score. An artisan who fails any of these doesn't get a lower score, they don't
 * appear at all. This is the key correction over a naive single-formula approach:
 * availability/verification/radius/category are eligibility, not preference.
 */
export function isEligible(candidate: ArtisanCandidate, ctx: EligibilityContext): boolean {
  const matchesSkill =
    candidate.primarySkill === ctx.category || candidate.secondarySkills.includes(ctx.category);
  if (!matchesSkill) return false;

  // VEYRO's trust promise is "every artisan is identity-verified" — unverified
  // or rejected artisans are excluded from matching entirely, not just down-ranked.
  if (candidate.verificationStatus !== "VERIFIED") return false;

  if (!candidate.availableNow) return false;

  const distanceKm = haversineKm(candidate.location, ctx.location);
  if (distanceKm > candidate.serviceRadiusKm) return false;

  return true;
}
