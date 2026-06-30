import { eventBus } from "@/platform/event-bus";
import { trustRepository } from "./trust.repository";
import { trustService } from "./trust.service";

/**
 * Trust Service never reads Matching's tables directly — it only learns about
 * jobs/reviews via these events, updates its OWN denormalized TrustProfile
 * counters, then recalculates the score. This is the eventual-consistency
 * seam called out in docs/ARCHITECTURE.md.
 */
export function registerTrustEventHandlers(): void {
  eventBus.subscribe("MatchAccepted", async (event) => {
    await trustRepository.getOrCreateTrustProfile(event.artisanId);
    await trustRepository.incrementTrustProfileCounters(event.artisanId, { totalJobsAccepted: 1 });
  });

  eventBus.subscribe("JobCompleted", async (event) => {
    await trustRepository.incrementTrustProfileCounters(event.artisanId, { completedJobs: 1 });
    await trustService.recalculateTrustScore(event.artisanId);
  });

  eventBus.subscribe("ReviewSubmitted", async (event) => {
    const profile = await trustRepository.getOrCreateTrustProfile(event.artisanId);
    const newCount = profile.ratingCount + 1;
    const newAvg = (profile.ratingAvg * profile.ratingCount + event.rating) / newCount;

    await trustRepository.updateTrustProfile(event.artisanId, {
      ratingAvg: newAvg,
      ratingCount: newCount,
    });
    await trustService.recalculateTrustScore(event.artisanId);
  });
}
