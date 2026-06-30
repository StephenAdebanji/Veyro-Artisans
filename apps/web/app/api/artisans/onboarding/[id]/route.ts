import { NextResponse } from "next/server";
import { z } from "zod";
import type { CredentialType } from "@veyro/contracts";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";
import { userService } from "@/services/user/user.service";

const stepSchema = z.object({
  step: z.number().int().min(1).max(8),
  data: z.record(z.string(), z.unknown()).optional(),
  credentials: z.array(z.object({ type: z.string(), fileUrl: z.string() })).optional(),
});

// Steps 4 (verification/ID), 5 (proof of address), 6 (credentials) are file
// uploads owned by Trust Service, not User Service — see docs/API.md.
const CREDENTIAL_STEPS = new Set([4, 5, 6]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: artisanId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await userService.getArtisanProfile(artisanId, { includePrivate: true });
  if (!profile || profile.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = stepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { step, data, credentials } = parsed.data;

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
}
