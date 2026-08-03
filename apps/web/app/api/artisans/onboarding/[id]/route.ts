import { NextResponse } from "next/server";
import { z } from "zod";
import type { CredentialType } from "@veyro/contracts";
import { auth } from "@/platform/auth-session";
import { geocodeStructured } from "@/platform/mapbox";
import { trustService } from "@/services/trust/trust.service";
import { userService } from "@/services/user/user.service";
import { withApiErrorHandling } from "@/platform/api-handler";

const stepSchema = z.object({
  step: z.number().int().min(1).max(8),
  data: z.record(z.string(), z.unknown()).optional(),
  credentials: z.array(z.object({ type: z.string(), fileUrl: z.string() })).optional(),
});

// Surfaces when the artisanId cached in the browser (localStorage) no longer
// matches the signed-in session — e.g. a second tab restarted the wizard
// (which signs the browser into a new account) while this tab, still holding
// the old artisanId, tries to keep submitting under it. A bare "Forbidden"
// gives the user nothing to do; this tells them how to recover.
const SESSION_MISMATCH_MESSAGE =
  "This application belongs to a different account than the one you're signed in as. Please go to “Join as artisan” again to start fresh.";

// Steps 4 (verification/ID), 5 (proof of address), 6 (credentials) are file
// uploads owned by Trust Service, not User Service — see docs/API.md.
const CREDENTIAL_STEPS = new Set([4, 5, 6]);

/** Returns the artisan's full private profile for onboarding resume hydration. */
export const GET = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: artisanId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await userService.getArtisanProfile(artisanId, { includePrivate: true }) as Record<string, unknown> | null;
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((profile.userId as string) !== userId) return NextResponse.json({ error: SESSION_MISMATCH_MESSAGE }, { status: 403 });

  return NextResponse.json({ profile });
});

export const PATCH = withApiErrorHandling(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: artisanId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await userService.getArtisanProfile(artisanId, { includePrivate: true });
  if (!profile || profile.userId !== userId) {
    return NextResponse.json({ error: SESSION_MISMATCH_MESSAGE }, { status: 403 });
  }

  const body = await request.json();
  const parsed = stepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { step, credentials } = parsed.data;
  const data = { ...(parsed.data.data ?? {}) };

  // Step 3 carries location fields — geocode them server-side so every artisan
  // gets accurate GPS coordinates rather than the Lagos-center fallback the
  // client sends. If Mapbox fails we keep whatever the client provided.
  if (step === 3) {
    const geo = await geocodeStructured({
      streetAddress: typeof data.residentialAddress === "string" ? data.residentialAddress : undefined,
      lga: typeof data.lga === "string" ? data.lga : (typeof data.city === "string" ? data.city : undefined),
      state: typeof data.state === "string" ? data.state : undefined,
      countryCode: typeof data.country === "string" && data.country.length === 2
        ? data.country
        : "NG",
    });
    if (geo) {
      data.gpsLat = geo.lat;
      data.gpsLng = geo.lng;
    }
  }

  if (CREDENTIAL_STEPS.has(step)) {
    for (const credential of credentials ?? []) {
      await trustService.submitCredential({
        artisanId,
        type: credential.type as CredentialType,
        fileUrl: credential.fileUrl,
      });
    }
  }

  // Always called — for non-credential steps this saves the step's own
  // fields; for credential steps it only advances the onboardingStep counter.
  await userService.updateArtisanOnboardingStep(artisanId, step, data ?? {});

  return NextResponse.json({ ok: true });
});
