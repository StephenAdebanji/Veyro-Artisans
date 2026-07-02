import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { chatService } from "@/services/chat/chat.service";
import { userService } from "@/services/user/user.service";

/** Get-or-create a conversation between the current artisan and a homeowner. */
export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ARTISAN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artisan = await userService.getArtisanProfileByUserId(user.id);
  if (!artisan) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { homeownerId, jobId } = (await request.json()) as { homeownerId: string; jobId?: string };
  if (!homeownerId) return NextResponse.json({ error: "homeownerId required" }, { status: 400 });

  const conversationId = await chatService.getOrCreateConversation(homeownerId, artisan.id, jobId);
  return NextResponse.json({ conversationId });
}

/** List conversations for the authenticated user. profileId (homeownerId or
 * artisanId) is resolved from the session — never trusted from the client. */
export async function GET() {
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

  if (!profileId) return NextResponse.json({ conversations: [] });

  const conversations = await chatService.listConversations(profileId);
  return NextResponse.json({ conversations });
}
