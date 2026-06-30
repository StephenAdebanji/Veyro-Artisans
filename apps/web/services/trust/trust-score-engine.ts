import type { TrustScoreBreakdown } from "@veyro/contracts";

/**
 * Weights from the brief (sum to 1.0):
 *   IdentityVerification=20%, CredentialVerification=20%, Ratings=25%,
 *   Reviews=15%, CompletionRate=10%, ResponseTime=10%
 *
 * Every input is normalized to [0,1] before weighting so the formula stays
 * explainable (no hidden scaling) — see the doc comments on TrustScoreInputs
 * for what "1.0" means for each dimension.
 */
export const TRUST_SCORE_WEIGHTS = {
  identityVerification: 0.2,
  credentialVerification: 0.2,
  ratings: 0.25,
  reviews: 0.15,
  completionRate: 0.1,
  responseTime: 0.1,
} as const;

export interface TrustScoreInputs {
  identityVerified: boolean;
  /** How many of the required credential types (ID, proof of address, trade cert) are APPROVED. */
  approvedCredentialCount: number;
  expectedCredentialCount: number;
  /** 0-5 star average. */
  ratingAvg: number;
  reviewCount: number;
  /** Review count beyond this many no longer adds trust (diminishing returns). */
  reviewCountCeiling: number;
  completedJobs: number;
  totalJobsAccepted: number;
  responseTimeAvgSeconds: number | null;
  /** At/under this response time scores 1.0. */
  responseTimeTargetSeconds: number;
}

export function calculateTrustScore(inputs: TrustScoreInputs): {
  score: number;
  breakdown: TrustScoreBreakdown;
} {
  const breakdown: TrustScoreBreakdown = {
    identityVerification: inputs.identityVerified ? 1 : 0,
    credentialVerification: clamp01(
      safeRatio(inputs.approvedCredentialCount, inputs.expectedCredentialCount),
    ),
    ratings: clamp01(inputs.ratingAvg / 5),
    reviews: clamp01(safeRatio(inputs.reviewCount, inputs.reviewCountCeiling)),
    completionRate: clamp01(safeRatio(inputs.completedJobs, inputs.totalJobsAccepted)),
    responseTime: clamp01(
      inputs.responseTimeAvgSeconds === null
        ? 0
        : inputs.responseTimeTargetSeconds / Math.max(inputs.responseTimeAvgSeconds, 1),
    ),
  };

  const score =
    100 *
    (TRUST_SCORE_WEIGHTS.identityVerification * breakdown.identityVerification +
      TRUST_SCORE_WEIGHTS.credentialVerification * breakdown.credentialVerification +
      TRUST_SCORE_WEIGHTS.ratings * breakdown.ratings +
      TRUST_SCORE_WEIGHTS.reviews * breakdown.reviews +
      TRUST_SCORE_WEIGHTS.completionRate * breakdown.completionRate +
      TRUST_SCORE_WEIGHTS.responseTime * breakdown.responseTime);

  return { score, breakdown };
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator <= 0 ? 0 : numerator / denominator;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
