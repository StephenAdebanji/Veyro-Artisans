import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { chatService } from "@/services/chat/chat.service";
import { userService } from "@/services/user/user.service";
import { withApiErrorHandling } from "@/platform/api-handler";

/** Get-or-create a conversation between the current user and their counterpart
 * (artisan supplies homeownerId, homeowner supplies artisanId). */
export const POST = withApiErrorHandling(async (request: Request) => {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { homeownerId?: string; artisanId?: string; jobId?: string };

  let homeownerId: string;
  let artisanId: string;

  if (user.role === "ARTISAN") {
    const artisan = await userService.getArtisanProfileByUserId(user.id);
    if (!artisan) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (!body.homeownerId) return NextResponse.json({ error: "homeownerId required" }, { status: 400 });
    homeownerId = body.homeownerId;
    artisanId = artisan.id;
  } else if (user.role === "HOMEOWNER") {
    const homeowner = await userService.getHomeownerProfileByUserId(user.id);
    if (!homeowner) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (!body.artisanId) return NextResponse.json({ error: "artisanId required" }, { status: 400 });
    homeownerId = homeowner.id;
    artisanId = body.artisanId;
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = await chatService.getOrCreateConversation(homeownerId, artisanId, body.jobId);
  return NextResponse.json({ conversationId });
});

/** List conversations for the authenticated user. profileId (homeownerId or
 * artisanId) is resolved from the session — never trusted from the client. */
export const GET = withApiErrorHandling(async () => {
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
});
