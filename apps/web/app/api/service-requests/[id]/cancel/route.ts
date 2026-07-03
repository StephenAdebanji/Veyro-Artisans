import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: serviceRequestId } = await params;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "HOMEOWNER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const homeowner = await userService.getHomeownerProfileByUserId(user.id);
  if (!homeowner) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  try {
    await matchingService.cancelServiceRequest(serviceRequestId, homeowner.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
