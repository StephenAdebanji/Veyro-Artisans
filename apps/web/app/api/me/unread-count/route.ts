import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { chatService } from "@/services/chat/chat.service";
import { userService } from "@/services/user/user.service";

export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ count: 0 });

  let profileId: string | null = null;
  if (user.role === "HOMEOWNER") {
    const homeowner = await userService.getHomeownerProfileByUserId(user.id);
    profileId = homeowner?.id ?? null;
  } else if (user.role === "ARTISAN") {
    const artisan = await userService.getArtisanProfileByUserId(user.id);
    profileId = artisan?.id ?? null;
  }

  if (!profileId) return NextResponse.json({ count: 0 });

  const count = await chatService.countUnreadForUser(profileId);
  return NextResponse.json({ count });
}
