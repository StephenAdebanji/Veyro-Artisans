import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { chatService } from "@/services/chat/chat.service";
import { userService } from "@/services/user/user.service";
import { MessagesLayout, type EnrichedConversation } from "@/components/chat/messages-layout";

export default async function HomeownerMessagesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) redirect("/sign-in");

  const rawConversations = await chatService.listConversations(homeowner.id);

  const conversations: EnrichedConversation[] = await Promise.all(
    rawConversations.map(async (c) => {
      const artisan = (await userService.getArtisanProfile(c.artisanId)) as Record<string, unknown> | null;
      const firstName = String(artisan?.firstName ?? "");
      const lastName = String(artisan?.lastName ?? "");
      const counterpartName = `${firstName} ${lastName}`.trim() || "Artisan";
      return {
        id: c.id,
        counterpartId: c.artisanId,
        counterpartName,
        lastMessageAt: c.lastMessageAt,
        unreadCount: c.unreadCount,
      };
    }),
  );

  return (
    <Suspense>
      <MessagesLayout conversations={conversations} currentProfileId={homeowner.id} backHref="/homeowner/dashboard" />
    </Suspense>
  );
}
