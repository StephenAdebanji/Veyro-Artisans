import { NextResponse } from "next/server";
import { matchingService } from "@/services/matching/matching.service";
import { withApiErrorHandling } from "@/platform/api-handler";

/** Poll fallback for the matching screen — the primary channel is the
 * Socket.io push from apps/realtime (Phase 7). */
export const GET = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const offers = await matchingService.listOffers(id);
  return NextResponse.json({ offers });
});
