import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { notificationService } from "@/services/notification/notification.service";
import { withApiErrorHandling } from "@/platform/api-handler";

const inviteSchema = z.object({ artisanId: z.string().min(1) });

const REALTIME_URL = process.env.REALTIME_INTERNAL_URL ?? "http://localhost:4001";

/** Homeowner directly invites one specific artisan (from the AI recommendation
 * panel) to offer on their request. Distinct from the generic category-wide
 * broadcast every eligible artisan already gets on creation — this pushes a
 * targeted, more visible highlight to just this one artisan. */
export const POST = withApiErrorHandling(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: serviceRequestId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) return NextResponse.json({ error: "No homeowner profile for this account" }, { status: 403 });

  const serviceRequest = await matchingService.getServiceRequest(serviceRequestId);
  if (!serviceRequest || serviceRequest.homeownerId !== homeowner.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const artisan = (await userService.getArtisanProfile(parsed.data.artisanId, { includePrivate: true })) as
    | { userId?: string; verificationStatus?: string }
    | null;
  if (!artisan) return NextResponse.json({ error: "Artisan not found" }, { status: 404 });

  // Same allowlist as the offers endpoint — never invite someone who
  // couldn't legally respond anyway.
  if (artisan.verificationStatus !== "VERIFIED") {
    return NextResponse.json({ error: "This artisan is not yet verified." }, { status: 400 });
  }

  await notificationService.notify(artisan.userId!, "JOB_INVITE", {
    serviceRequestId,
    category: serviceRequest.category,
    description: serviceRequest.description,
    address: serviceRequest.address,
  });

  fetch(`${REALTIME_URL}/internal/matching/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      artisanUserId: artisan.userId,
      id: serviceRequestId,
      category: serviceRequest.category,
      description: serviceRequest.description,
      address: serviceRequest.address,
      budgetMin: serviceRequest.budgetMin ?? null,
      budgetMax: serviceRequest.budgetMax ?? null,
      lat: serviceRequest.location.lat,
      lng: serviceRequest.location.lng,
      createdAt: serviceRequest.createdAt,
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
});
