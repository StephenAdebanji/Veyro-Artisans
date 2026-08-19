import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { matchingRepository } from "@/services/matching/matching.repository";
import { userService } from "@/services/user/user.service";
import { withApiErrorHandling } from "@/platform/api-handler";

const REALTIME_URL = process.env.REALTIME_INTERNAL_URL ?? "http://localhost:4001";

/** Homeowner accepts a specific offer card — creates the Job, expires all other
 * pending offers for this request, and notifies apps/realtime so the matching
 * screen transitions to the accepted state. Returns the artisan's phone so the
 * homeowner's client can offer a "Call" action once confirmed. */
export const POST = withApiErrorHandling(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: matchId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const match = await matchingRepository.findMatch(matchId);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  // Ownership check: the match's service request must belong to this homeowner.
  const serviceRequest = await matchingService.getServiceRequest(match.serviceRequestId);
  if (!serviceRequest || serviceRequest.homeownerId !== homeowner.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId } = await matchingService.respondToOffer(matchId, "ACCEPT");

  const artisan = (await userService.getArtisanProfile(match.artisanId)) as
    | { user?: { phone?: string | null } }
    | null;
  const artisanPhone = artisan?.user?.phone ?? null;

  fetch(`${REALTIME_URL}/internal/matching/${serviceRequest.id}/responded`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId, decision: "ACCEPT", jobId, artisanId: match.artisanId, artisanPhone }),
  }).catch(() => {});

  // Remove the card from every other artisan's live feed — the job is taken.
  fetch(`${REALTIME_URL}/internal/matching/broadcast-cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceRequestId: serviceRequest.id, category: serviceRequest.category }),
  }).catch(() => {});

  return NextResponse.json({ jobId, artisanId: match.artisanId, artisanPhone });
});
