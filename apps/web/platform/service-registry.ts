import { registerBlockchainEventHandlers } from "@/services/blockchain/blockchain.events";
import { registerChatEventHandlers } from "@/services/chat/chat.events";
import { registerNotificationEventHandlers } from "@/services/notification/notification.handlers";
import { registerTrustEventHandlers } from "@/services/trust/trust.events";
import { registerUserEventHandlers } from "@/services/user/user.events";

let wired = false;

/**
 * Boot-time wiring: registers every service's event subscriptions exactly
 * once (see apps/web/instrumentation.ts for where this is called).
 */
export function registerAllEventHandlers(): void {
  if (wired) return;
  wired = true;

  registerTrustEventHandlers();
  registerUserEventHandlers();
  registerChatEventHandlers();
  registerNotificationEventHandlers();
  registerBlockchainEventHandlers();
}
