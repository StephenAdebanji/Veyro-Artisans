import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { matchingRepository } from "@/services/matching/matching.repository";
import { userService } from "@/services/user/user.service";
import { withApiErrorHandling } from "@/platform/api-handler";

const respondSchema = z.object({
  decision: z.enum(["ACCEPT", "DECLINE"]),
  reason: z.string().optional(),
});

const REALTIME_URL = process.env.REALTIME_INTERNAL_URL ?? "http://localhost:4001";

/** The homeowner's Accept/Decline click on one offer card. In practice only
 * DECLINE goes through here — Accept uses the dedicated /accept route — but
 * this stays generic since the client posts a single `decision` field. */
export const POST = withApiErrorHandling(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: matchId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.decision === "DECLINE" && !parsed.data.reason?.trim()) {
    return NextResponse.json({ error: "A reason is required to reject an offer." }, { status: 400 });
  }

  const match = await matchingRepository.findMatch(matchId);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const serviceRequest = await matchingService.getServiceRequest(match.serviceRequestId);
  if (!serviceRequest || serviceRequest.homeownerId !== homeowner.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await matchingService.respondToOffer(
    matchId,
    parsed.data.decision,
    parsed.data.reason?.trim(),
  );

  if (parsed.data.decision === "DECLINE") {
    const artisan = (await userService.getArtisanProfile(match.artisanId)) as { userId?: string } | null;
    if (artisan?.userId) {
      fetch(`${REALTIME_URL}/internal/matching/offer-declined`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanUserId: artisan.userId,
          matchId,
          description: serviceRequest.description,
          reason: parsed.data.reason!.trim(),
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json(result);
});
