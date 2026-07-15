import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { SKILL_CATEGORIES } from "@/components/shared/skill-labels";
import { geocodeStructured } from "@/platform/mapbox";
import type { GeoPoint, SkillCategory } from "@veyro/contracts";

const LAGOS_FALLBACK: GeoPoint = { lat: 6.5244, lng: 3.3792 };

const createRequestSchema = z.object({
  category: z.enum(SKILL_CATEGORIES as unknown as [string, ...string[]]).transform((v) => v as SkillCategory),
  description: z.string().min(1),
  streetAddress: z.string().min(1),
  lga: z.string().optional(),
  state: z.string().min(1),
  country: z.string().min(1).default("Nigeria"),
  countryCode: z.string().optional().default("NG"),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  preferredDate: z.string().optional(),
});

const REALTIME_URL = process.env.REALTIME_INTERNAL_URL ?? "http://localhost:4001";

export async function POST(request: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) return NextResponse.json({ error: "No homeowner profile for this account" }, { status: 403 });

  const body = await request.json();
  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { streetAddress, lga, state, country, countryCode, ...rest } = parsed.data;

  // Build a clean display address from structured components.
  const address = [streetAddress, lga, state, country].filter(Boolean).join(", ");

  // Structured geocoding is more accurate than a freeform string — each component
  // maps to a distinct Mapbox field, avoiding the disambiguation guessing.
  const location =
    (await geocodeStructured({ streetAddress, lga, state, countryCode: countryCode ?? "NG" })) ??
    LAGOS_FALLBACK;

  const serviceRequestId = await matchingService.createServiceRequest({
    homeownerId: homeowner.id,
    ...rest,
    address,
    location,
  });

  fetch(`${REALTIME_URL}/internal/matching/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: serviceRequestId,
      category: parsed.data.category,
      description: parsed.data.description,
      address,
      budgetMin: parsed.data.budgetMin ?? null,
      budgetMax: parsed.data.budgetMax ?? null,
      lat: location.lat,
      lng: location.lng,
      createdAt: new Date().toISOString(),
    }),
  }).catch(() => {});

  return NextResponse.json({ serviceRequestId }, { status: 201 });
}
