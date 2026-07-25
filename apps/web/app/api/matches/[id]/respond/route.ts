import { NextResponse } from "next/server";
import { z } from "zod";
import { matchingService } from "@/services/matching/matching.service";

const respondSchema = z.object({
  decision: z.enum(["ACCEPT", "DECLINE"]),
  reason: z.string().optional(),
});

/** The homeowner's Accept/Decline click on one offer card. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const body = await request.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.decision === "DECLINE" && !parsed.data.reason?.trim()) {
    return NextResponse.json({ error: "A reason is required to reject an offer." }, { status: 400 });
  }

  const result = await matchingService.respondToOffer(
    matchId,
    parsed.data.decision,
    parsed.data.reason?.trim(),
  );
  return NextResponse.json(result);
}
