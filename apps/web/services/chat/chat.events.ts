import { eventBus } from "@/platform/event-bus";
import { chatRepository } from "./chat.repository";

/** Chat Service learns about a new hire only through MatchAccepted — it never
 * queries Matching's tables to find out who got hired. */
export function registerChatEventHandlers(): void {
  eventBus.subscribe("MatchAccepted", async (event) => {
    const existing = await chatRepository.findConversationBetween(event.homeownerId, event.artisanId);
    if (!existing) {
      await chatRepository.createConversation(event.homeownerId, event.artisanId, event.jobId);
    }
  });
}
