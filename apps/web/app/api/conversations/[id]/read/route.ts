import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { chatService } from "@/services/chat/chat.service";
import { userService } from "@/services/user/user.service";

/** Mark all unread messages in a conversation as read for the current user. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let profileId: string | null = null;
  if (user.role === "HOMEOWNER") {
    const homeowner = await userService.getHomeownerProfileByUserId(user.id);
    profileId = homeowner?.id ?? null;
  } else if (user.role === "ARTISAN") {
    const artisan = await userService.getArtisanProfileByUserId(user.id);
    profileId = artisan?.id ?? null;
  }

  if (!profileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await chatService.markRead(conversationId, profileId);
  return NextResponse.json({ ok: true });
}
