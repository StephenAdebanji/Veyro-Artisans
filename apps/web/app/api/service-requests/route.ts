import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { SKILL_CATEGORIES } from "@/components/shared/skill-labels";
import { geocodeAddress } from "@/platform/mapbox";
import type { GeoPoint, SkillCategory } from "@veyro/contracts";

const LAGOS_FALLBACK: GeoPoint = { lat: 6.5244, lng: 3.3792 };

const createRequestSchema = z.object({
  category: z.enum(SKILL_CATEGORIES as unknown as [string, ...string[]]).transform((v) => v as SkillCategory),
  description: z.string().min(1),
  address: z.string().min(1),
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

  // Geocode the address — append Nigeria to bias results, fall back to Lagos centre.
  const location = (await geocodeAddress(`${parsed.data.address}, Nigeria`)) ?? LAGOS_FALLBACK;

  const serviceRequestId = await matchingService.createServiceRequest({
    homeownerId: homeowner.id,
    ...parsed.data,
    location,
  });

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
      lat: location.lat,
      lng: location.lng,
      createdAt: new Date().toISOString(),
    }),
  }).catch(() => {});

  return NextResponse.json({ serviceRequestId }, { status: 201 });
}
