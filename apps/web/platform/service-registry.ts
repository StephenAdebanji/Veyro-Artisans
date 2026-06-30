import { registerBlockchainEventHandlers } from "@/services/blockchain/blockchain.events";
import { registerChatEventHandlers } from "@/services/chat/chat.events";
import { registerNotificationEventHandlers } from "@/services/notification/notification.handlers";
import { registerTrustEventHandlers } from "@/services/trust/trust.events";

let wired = false;

/**
 * Boot-time wiring: registers every service's event subscriptions exactly
 * once (see apps/web/instrumentation.ts for where this is called). Auth,
 * User, Matching and AI Recommendation only ever publish events or are called
 * synchronously — they have nothing to subscribe, so they're not listed here.
 */
export function registerAllEventHandlers(): void {
  if (wired) return;
  wired = true;

  registerTrustEventHandlers();
  registerChatEventHandlers();
  registerNotificationEventHandlers();
  registerBlockchainEventHandlers();
}
