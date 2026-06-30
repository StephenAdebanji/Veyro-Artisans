import type {
  PendingCredentialSummary,
  SubmitCredentialInput,
  TrustProfileSnapshot,
  TrustScoreBreakdown,
  TrustServicePort,
} from "@veyro/contracts";
import { eventBus } from "@/platform/event-bus";
import { trustRepository } from "./trust.repository";
import { calculateTrustScore } from "./trust-score-engine";

const EXPECTED_CREDENTIAL_COUNT = 3; // ID + proof of address + trade certificate
const REVIEW_COUNT_CEILING = 20;
const RESPONSE_TIME_TARGET_SECONDS = 120;

class TrustService implements TrustServicePort {
  async submitCredential(input: SubmitCredentialInput): Promise<string> {
    const credential = await trustRepository.createCredential({
      artisanId: input.artisanId,
      type: input.type,
      fileUrl: input.fileUrl,
    });

    eventBus.publish({
      type: "CredentialSubmitted",
      credentialId: credential.id,
      artisanId: input.artisanId,
      credentialType: input.type,
      occurredAt: new Date().toISOString(),
    });

    return credential.id;
  }

  async reviewCredential(
    credentialId: string,
    decision: "APPROVED" | "REJECTED",
    reviewedBy: string,
    reason?: string,
  ): Promise<void> {
    const credential = await trustRepository.updateCredentialStatus(credentialId, decision, reviewedBy);

    if (decision === "APPROVED") {
      eventBus.publish({
        type: "CredentialApproved",
        credentialId,
        artisanId: credential.artisanId,
        reviewedBy,
        occurredAt: new Date().toISOString(),
      });
    } else {
      eventBus.publish({
        type: "CredentialRejected",
        credentialId,
        artisanId: credential.artisanId,
        reviewedBy,
        reason,
        occurredAt: new Date().toISOString(),
      });
    }

    await this.recalculateTrustScore(credential.artisanId);
  }

  async verifyIdentity(artisanId: string, reviewedBy: string): Promise<void> {
    await trustRepository.getOrCreateTrustProfile(artisanId);
    await trustRepository.updateTrustProfile(artisanId, { verificationStatus: "VERIFIED" });

    eventBus.publish({
      type: "IdentityVerified",
      artisanId,
      reviewedBy,
      occurredAt: new Date().toISOString(),
    });

    await this.recalculateTrustScore(artisanId);
  }

  async recalculateTrustScore(
    artisanId: string,
  ): Promise<{ score: number; breakdown: TrustScoreBreakdown }> {
    const profile = await trustRepository.getOrCreateTrustProfile(artisanId);
    const approvedCredentialCount = await trustRepository.countApprovedCredentials(artisanId);

    const { score, breakdown } = calculateTrustScore({
      identityVerified: profile.verificationStatus === "VERIFIED",
      approvedCredentialCount,
      expectedCredentialCount: EXPECTED_CREDENTIAL_COUNT,
      ratingAvg: profile.ratingAvg,
      reviewCount: profile.ratingCount,
      reviewCountCeiling: REVIEW_COUNT_CEILING,
      completedJobs: profile.completedJobs,
      totalJobsAccepted: profile.totalJobsAccepted,
      responseTimeAvgSeconds: profile.responseTimeAvgSeconds,
      responseTimeTargetSeconds: RESPONSE_TIME_TARGET_SECONDS,
    });

    await trustRepository.updateTrustProfile(artisanId, { trustScore: score });
    await trustRepository.recordScoreHistory(profile.id, score, breakdown, "SYSTEM_RECALC");

    eventBus.publish({
      type: "TrustScoreUpdated",
      artisanId,
      score,
      breakdown,
      occurredAt: new Date().toISOString(),
    });

    return { score, breakdown };
  }

  async getTrustProfile(artisanId: string): Promise<TrustProfileSnapshot | null> {
    const profile = await trustRepository.getOrCreateTrustProfile(artisanId);
    return {
      score: profile.trustScore,
      verificationStatus: profile.verificationStatus,
      ratingAvg: profile.ratingAvg,
      ratingCount: profile.ratingCount,
      completedJobs: profile.completedJobs,
      responseTimeAvgSeconds: profile.responseTimeAvgSeconds ?? 0,
    };
  }

  async getScoreHistory(artisanId: string): Promise<Array<{ score: number; createdAt: string }>> {
    const history = await trustRepository.listScoreHistory(artisanId);
    return history.map((entry) => ({ score: entry.score, createdAt: entry.createdAt.toISOString() }));
  }

  async listPendingCredentials(): Promise<PendingCredentialSummary[]> {
    const pending = await trustRepository.listPending();
    return pending.map((credential) => ({
      id: credential.id,
      artisanId: credential.artisanId,
      type: credential.type,
      createdAt: credential.createdAt.toISOString(),
    }));
  }
}

export const trustService = new TrustService();
