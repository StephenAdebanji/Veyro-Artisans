import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";

const REALTIME_URL = process.env.REALTIME_INTERNAL_URL ?? "http://localhost:4001";

/** Homeowner accepts a specific offer card — creates the Job, expires all other
 * pending offers for this request, and notifies apps/realtime so the matching
 * screen transitions to the accepted state. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Ownership check: the match's service request must belong to this homeowner.
  const serviceRequest = await matchingService.getServiceRequest(
    await getServiceRequestIdForMatch(matchId),
  );
  if (!serviceRequest || serviceRequest.homeownerId !== homeowner.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId } = await matchingService.respondToOffer(matchId, "ACCEPT");

  fetch(`${REALTIME_URL}/internal/matching/${serviceRequest.id}/responded`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId, decision: "ACCEPT", jobId }),
  }).catch(() => {});

  return NextResponse.json({ jobId });
}

async function getServiceRequestIdForMatch(matchId: string): Promise<string> {
  const { matchingRepository } = await import("@/services/matching/matching.repository");
  const match = await matchingRepository.findMatch(matchId);
  if (!match) throw new Error("Match not found");
  return match.serviceRequestId;
}
