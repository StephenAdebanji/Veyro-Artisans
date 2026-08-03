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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
