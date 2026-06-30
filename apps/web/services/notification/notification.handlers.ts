import { eventBus } from "@/platform/event-bus";
import { notificationService } from "./notification.service";

/**
 * Pure fan-out consumer: subscribes to nearly every DomainEvent, and no other
 * service ever depends on Notification synchronously. That makes this the
 * easiest service to extract right after Blockchain/Chat — it only reads
 * events, it never owns data anyone else needs back.
 *
 * Dispute notifications are intentionally not wired yet — Matching Service
 * doesn't expose raiseDispute/resolveDispute until Phase 11 (Admin Dashboard),
 * so there's no producer for DisputeRaised/DisputeResolved today.
 */
export function registerNotificationEventHandlers(): void {
  eventBus.subscribe("MatchOffered", async (event) => {
    await notificationService.notify(event.artisanId, "MATCH_OFFERED", event);
  });

  eventBus.subscribe("MatchAccepted", async (event) => {
    await notificationService.notify(event.artisanId, "MATCH_ACCEPTED", event);
    await notificationService.notify(event.homeownerId, "MATCH_ACCEPTED", event);
  });

  eventBus.subscribe("JobCompleted", async (event) => {
    await notificationService.notify(event.artisanId, "JOB_COMPLETED", event);
    await notificationService.notify(event.homeownerId, "JOB_COMPLETED", event);
  });

  eventBus.subscribe("CredentialApproved", async (event) => {
    await notificationService.notify(event.artisanId, "CREDENTIAL_APPROVED", event);
  });

  eventBus.subscribe("CredentialRejected", async (event) => {
    await notificationService.notify(event.artisanId, "CREDENTIAL_REJECTED", event);
  });

  eventBus.subscribe("TrustScoreUpdated", async (event) => {
    await notificationService.notify(event.artisanId, "TRUST_SCORE_UPDATED", event);
  });

  eventBus.subscribe("MessageSent", async (event) => {
    await notificationService.notify(event.receiverId, "MESSAGE_RECEIVED", event);
  });
}
