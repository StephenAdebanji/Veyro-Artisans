import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { chatService } from "@/services/chat/chat.service";
import { userService } from "@/services/user/user.service";
import { MessagesLayout, type EnrichedConversation } from "@/components/chat/messages-layout";

export default async function ArtisanMessagesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const artisanRef = await userService.getArtisanProfileByUserId(userId);
  if (!artisanRef) redirect("/sign-in");

  const rawConversations = await chatService.listConversations(artisanRef.id);

  const conversations: EnrichedConversation[] = await Promise.all(
    rawConversations.map(async (c) => {
      const homeowner = await userService.getHomeownerProfile(c.homeownerId);
      const counterpartName = homeowner?.fullName ?? "Homeowner";
      return {
        id: c.id,
        counterpartId: c.homeownerId,
        counterpartName,
        lastMessageAt: c.lastMessageAt,
        unreadCount: c.unreadCount,
        lastMessagePreview: c.lastMessagePreview ?? null,
      };
    }),
  );

  return (
    <Suspense>
      <MessagesLayout conversations={conversations} currentProfileId={artisanRef.id} backHref="/artisan/dashboard" />
    </Suspense>
  );
}
