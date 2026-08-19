import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { withApiErrorHandling } from "@/platform/api-handler";

const REALTIME_URL = process.env.REALTIME_INTERNAL_URL ?? "http://localhost:4001";

export const POST = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: serviceRequestId } = await params;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "HOMEOWNER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const homeowner = await userService.getHomeownerProfileByUserId(user.id);
  if (!homeowner) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { category } = await matchingService.cancelServiceRequest(serviceRequestId, homeowner.id);

  // Notify all artisans watching this skill category so the card vanishes immediately.
  fetch(`${REALTIME_URL}/internal/matching/broadcast-cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceRequestId, category }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
});
