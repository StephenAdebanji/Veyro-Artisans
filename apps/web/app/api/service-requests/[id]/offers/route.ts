import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { blockchainService } from "@/services/blockchain/blockchain.service";
import { withApiErrorHandling } from "@/platform/api-handler";

// Match.proposedPrice is a Postgres INT4 column (max 2,147,483,647) — capping
// well under that turns an overflow into a clean validation error instead of
// an unhandled Prisma "Unable to fit integer value into an INT4" crash.
const offerSchema = z.object({
  proposedPrice: z.number().positive().max(999_999_999, "Price is too large."),
  etaMinutes: z.number().positive().max(10_000, "ETA is too large."),
  distanceKm: z.number().nonnegative(),
});

const REALTIME_URL = process.env.REALTIME_INTERNAL_URL ?? "http://localhost:4001";

/** List existing offers for a service request — used by the matching screen
 * on initial SSR load so the homeowner sees any offers that arrived before
 * the Socket.io connection was established. */
export const GET = withApiErrorHandling(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: serviceRequestId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offers = await matchingService.listOffers(serviceRequestId);

  // Enrich each offer with artisan display data.
  const enriched = await Promise.all(
    offers.map(async (offer) => {
      const [artisan, chainRecords] = await Promise.all([
        userService.getArtisanProfile(offer.artisanId) as Promise<Record<string, unknown> | null>,
        blockchainService.getRecordsForRef(offer.artisanId),
      ]);
      return {
        matchId: offer.id,
        artisanId: offer.artisanId,
        artisanName: artisan ? `${artisan.firstName ?? ""} ${artisan.lastName ?? ""}`.trim() : "Artisan",
        ratingAvg: Number(artisan?.ratingAvg ?? 0),
        ratingCount: Number(artisan?.ratingCount ?? 0),
        trustScore: Number(artisan?.trustScore ?? 0),
        profilePhotoUrl: (artisan?.profilePhotoUrl as string | null | undefined) ?? null,
        city: (artisan?.city as string | null | undefined) ?? null,
        state: (artisan?.state as string | null | undefined) ?? null,
        proposedPrice: offer.proposedPrice,
        etaMinutes: offer.etaMinutes,
        distanceKm: offer.distanceKm,
        status: offer.status,
        blockchainVerified: chainRecords.some((r) => r.status === "CONFIRMED"),
      };
    }),
  );

  return NextResponse.json({ offers: enriched });
});

/** An artisan submits a price/ETA offer in response to a broadcasted request —
 * this renders as a live offer card on the homeowner's matching screen.
 * `artisanId` is resolved from the session server-side. */
export const POST = withApiErrorHandling(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
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

  // Only artisans admin has verified can respond to jobs — this cannot be a
  // client-side-only check, since the client is never a trust boundary.
  if (artisan.verificationStatus !== "VERIFIED") {
    return NextResponse.json(
      { error: "Your account must be verified by our trust team before you can send offers." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let matchId: string;
  try {
    matchId = await matchingService.offerMatch({
      serviceRequestId,
      artisanId: artisan.id,
      ...parsed.data,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_CANCELLED") {
      return NextResponse.json(
        {
          error:
            "Oops! It looks like the customer has already cancelled this request. Hang tight — new jobs come in regularly, and the next one could be yours!",
        },
        { status: 409 },
      );
    }
    if (err instanceof Error && err.message === "OFFER_WINDOW_EXPIRED") {
      return NextResponse.json(
        { error: "The offer window for this job has closed. Check back for newer requests nearby." },
        { status: 409 },
      );
    }
    throw err;
  }

  // Fetch the full profile for display stats (summary type has no rating/trust).
  const [fullProfile, chainRecords] = await Promise.all([
    userService.getArtisanProfile(artisan.id) as Promise<Record<string, unknown> | null>,
    blockchainService.getRecordsForRef(artisan.id),
  ]);

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
      profilePhotoUrl: (fullProfile?.profilePhotoUrl as string | null | undefined) ?? null,
      city: (fullProfile?.city as string | null | undefined) ?? null,
      state: (fullProfile?.state as string | null | undefined) ?? null,
      proposedPrice: parsed.data.proposedPrice,
      etaMinutes: parsed.data.etaMinutes,
      distanceKm: parsed.data.distanceKm,
      status: "PENDING",
      blockchainVerified: chainRecords.some((r) => r.status === "CONFIRMED"),
    }),
  }).catch(() => {});

  return NextResponse.json({ matchId }, { status: 201 });
});
