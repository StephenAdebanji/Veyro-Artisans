import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: artisanId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await userService.getArtisanProfile(artisanId, { includePrivate: true });
  if (!profile || profile.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await userService.submitArtisanOnboarding(artisanId);
  return NextResponse.json({ ok: true });
}
