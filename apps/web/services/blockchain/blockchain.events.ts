import { eventBus } from "@/platform/event-bus";
import { blockchainService } from "./blockchain.service";

/** Blockchain Service anchors records asynchronously in reaction to events
 * from Trust and Matching — it never sits on the request path of the action
 * that triggered it. */
export function registerBlockchainEventHandlers(): void {
  eventBus.subscribe("IdentityVerified", async (event) => {
    await blockchainService.enqueueRecord("IDENTITY_VERIFIED", event.artisanId, event);
  });

  eventBus.subscribe("CredentialApproved", async (event) => {
    await blockchainService.enqueueRecord("CREDENTIAL_VERIFIED", event.credentialId, event);
  });

  eventBus.subscribe("TrustScoreUpdated", async (event) => {
    await blockchainService.enqueueRecord("TRUST_SCORE_UPDATE", event.artisanId, event);
  });

  eventBus.subscribe("ReviewSubmitted", async (event) => {
    await blockchainService.enqueueRecord("REVIEW_HASH", event.reviewId, event);
  });
}
