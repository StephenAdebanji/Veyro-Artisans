import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";

const offerSchema = z.object({
  proposedPrice: z.number().positive(),
  etaMinutes: z.number().positive(),
  distanceKm: z.number().nonnegative(),
});

const REALTIME_URL = process.env.REALTIME_INTERNAL_URL ?? "http://localhost:4001";

/** List existing offers for a service request — used by the matching screen
 * on initial SSR load so the homeowner sees any offers that arrived before
 * the Socket.io connection was established. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: serviceRequestId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offers = await matchingService.listOffers(serviceRequestId);

  // Enrich each offer with artisan display data.
  const enriched = await Promise.all(
    offers.map(async (offer) => {
      const artisan = await userService.getArtisanProfile(offer.artisanId) as Record<string, unknown> | null;
      return {
        matchId: offer.id,
        artisanId: offer.artisanId,
        artisanName: artisan ? `${artisan.firstName ?? ""} ${artisan.lastName ?? ""}`.trim() : "Artisan",
        ratingAvg: Number(artisan?.ratingAvg ?? 0),
        ratingCount: Number(artisan?.ratingCount ?? 0),
        trustScore: Number(artisan?.trustScore ?? 0),
        proposedPrice: offer.proposedPrice,
        etaMinutes: offer.etaMinutes,
        distanceKm: offer.distanceKm,
        status: offer.status,
      };
    }),
  );

  return NextResponse.json({ offers: enriched });
}

/** An artisan submits a price/ETA offer in response to a broadcasted request —
 * this renders as a live offer card on the homeowner's matching screen.
 * `artisanId` is resolved from the session server-side. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: serviceRequestId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artisan = await userService.getArtisanProfileByUserId(userId);
  if (!artisan) {
    return NextResponse.json({ error: "No artisan profile for this account" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const matchId = await matchingService.offerMatch({
    serviceRequestId,
    artisanId: artisan.id,
    ...parsed.data,
  });

  // Fetch the full profile for display stats (summary type has no rating/trust).
  const fullProfile = await userService.getArtisanProfile(artisan.id) as Record<string, unknown> | null;

  // Push enriched offer card to the homeowner's matching screen live.
  fetch(`${REALTIME_URL}/internal/matching/${serviceRequestId}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matchId,
      artisanId: artisan.id,
      artisanName: `${artisan.firstName ?? ""} ${artisan.lastName ?? ""}`.trim() || "Artisan",
      ratingAvg: Number(fullProfile?.ratingAvg ?? 0),
      ratingCount: Number(fullProfile?.ratingCount ?? 0),
      trustScore: Number(fullProfile?.trustScore ?? 0),
      proposedPrice: parsed.data.proposedPrice,
      etaMinutes: parsed.data.etaMinutes,
      distanceKm: parsed.data.distanceKm,
      status: "PENDING",
    }),
  }).catch(() => {});

  return NextResponse.json({ matchId }, { status: 201 });
}
