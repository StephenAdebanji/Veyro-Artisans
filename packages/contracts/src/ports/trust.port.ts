import type { CredentialType, VerificationStatus } from "../common";

export interface SubmitCredentialInput {
  artisanId: string;
  type: CredentialType;
  fileUrl: string;
}

export interface TrustScoreBreakdown {
  identityVerification: number;
  credentialVerification: number;
  ratings: number;
  reviews: number;
  completionRate: number;
  responseTime: number;
}

export interface TrustProfileSnapshot {
  score: number;
  verificationStatus: VerificationStatus;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  responseTimeAvgSeconds: number;
}

export interface PendingCredentialSummary {
  id: string;
  artisanId: string;
  artisanName: string | null;
  artisanEmail: string | null;
  type: CredentialType;
  createdAt: string;
}

/**
 * Owns: Credential (verification workflow), TrustScoreHistory, TrustProfile (denormalized
 * stats). TrustProfile is updated only via events from Matching (JobCompleted, ReviewSubmitted)
 * — never via a live read of Matching's tables.
 */
export interface TrustServicePort {
  submitCredential(input: SubmitCredentialInput): Promise<string>;
  reviewCredential(
    credentialId: string,
    decision: "APPROVED" | "REJECTED",
    reviewedBy: string,
    reason?: string,
  ): Promise<void>;
  verifyIdentity(artisanId: string, reviewedBy: string): Promise<void>;
  recalculateTrustScore(
    artisanId: string,
  ): Promise<{ score: number; breakdown: TrustScoreBreakdown }>;
  getTrustProfile(artisanId: string): Promise<TrustProfileSnapshot | null>;
  getScoreHistory(artisanId: string): Promise<Array<{ score: number; createdAt: string }>>;
  /** Backs the admin verification queue (docs/API.md). */
  listPendingCredentials(): Promise<PendingCredentialSummary[]>;
}
