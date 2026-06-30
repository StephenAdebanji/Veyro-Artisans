import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";

const SKILL_CATEGORIES = [
  "ELECTRICIAN",
  "PLUMBER",
  "CARPENTER",
  "PAINTER",
  "WELDER",
  "SOLAR_TECHNICIAN",
  "CCTV_INSTALLER",
  "INTERIOR_DECORATOR",
] as const;

const createRequestSchema = z.object({
  category: z.enum(SKILL_CATEGORIES),
  description: z.string().min(1),
  location: z.object({ lat: z.number(), lng: z.number() }),
  address: z.string().min(1),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  preferredDate: z.string().optional(),
});

const REALTIME_URL = process.env.REALTIME_INTERNAL_URL ?? "http://localhost:4001";

/** Creating a request kicks off the InDrive-style live matching flow —
 * after the DB write it fire-and-forgets a broadcast to apps/realtime so
 * every connected artisan in the matching skill room sees the new job live.
 * `homeownerId` is resolved from the session server-side, never trusted from
 * the client. */
export async function POST(request: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) {
    return NextResponse.json({ error: "No homeowner profile for this account" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const serviceRequestId = await matchingService.createServiceRequest({
    homeownerId: homeowner.id,
    ...parsed.data,
  });

  // Fire-and-forget broadcast to apps/realtime so artisans see the new job live.
  fetch(`${REALTIME_URL}/internal/matching/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: serviceRequestId,
      category: parsed.data.category,
      description: parsed.data.description,
      address: parsed.data.address,
      budgetMin: parsed.data.budgetMin ?? null,
      budgetMax: parsed.data.budgetMax ?? null,
      lat: parsed.data.location.lat,
      lng: parsed.data.location.lng,
      createdAt: new Date().toISOString(),
    }),
  }).catch(() => {
    // Realtime server being down must not fail the API call.
  });

  return NextResponse.json({ serviceRequestId }, { status: 201 });
}
