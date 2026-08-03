import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";
import { userService } from "@/services/user/user.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const POST = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: artisanId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await userService.getArtisanProfile(artisanId, { includePrivate: true });
  if (!profile || profile.userId !== userId) {
    // Cached artisanId (localStorage) no longer matches the signed-in session —
    // e.g. a second tab restarted the wizard and signed this browser into a
    // different account while this tab kept the old artisanId. Tell the user
    // how to recover instead of a bare "Forbidden".
    return NextResponse.json(
      { error: "This application belongs to a different account than the one you're signed in as. Please go to “Join as artisan” again to start fresh." },
      { status: 403 },
    );
  }

  // Steps 4/5 are meant to be required, but nothing before this point actually
  // enforces it server-side — a client that skips ahead (or a retried/partial
  // request) can otherwise reach PENDING_REVIEW with no KYC documents at all.
  const { missingGovtId, missingProofOfAddress } = await trustService.getMissingCompulsoryCredentials(artisanId);
  if (missingGovtId || missingProofOfAddress) {
    const missing = [
      missingGovtId ? "a government ID" : null,
      missingProofOfAddress ? "a proof of address (utility bill)" : null,
    ].filter((label): label is string => label !== null);
    return NextResponse.json(
      { error: `Please upload ${missing.join(" and ")} before submitting your application.` },
      { status: 400 },
    );
  }

  await userService.submitArtisanOnboarding(artisanId);
  return NextResponse.json({ ok: true });
});
