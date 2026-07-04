import { eventBus } from "@/platform/event-bus";
import { prisma } from "@/platform/prisma";

/**
 * Keeps the ArtisanProfile denormalized cache in sync with TrustProfile.
 * trust.events.ts is the source of truth — it updates TrustProfile and
 * then publishes TrustScoreUpdated. We react to that event to write the
 * cached values (trustScore, ratingAvg, ratingCount, completedJobs) onto
 * ArtisanProfile so every UI read — dashboards, search results, AI scoring —
 * sees the latest numbers without a cross-schema join.
 */
export function registerUserEventHandlers(): void {
  eventBus.subscribe("TrustScoreUpdated", async (event) => {
    const trustProfile = await prisma.trustProfile.findUnique({
      where: { artisanId: event.artisanId },
    });
    if (!trustProfile) return;

    await prisma.artisanProfile.updateMany({
      where: { id: event.artisanId },
      data: {
        trustScore: trustProfile.trustScore,
        ratingAvg: trustProfile.ratingAvg,
        ratingCount: trustProfile.ratingCount,
        completedJobs: trustProfile.completedJobs,
      },
    });
  });
}
