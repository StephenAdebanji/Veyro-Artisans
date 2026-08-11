import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";
import { trustRepository } from "@/services/trust/trust.repository";
import { userRepository } from "@/services/user/user.repository";
import { authService } from "@/services/auth/auth.service";
import { withApiErrorHandling } from "@/platform/api-handler";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== "ADMIN") return null;
  return user;
}

export const PATCH = withApiErrorHandling(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: artisanId } = await params;
  const artisan = await userRepository.findArtisanProfileFull(artisanId);
  if (!artisan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { decision: string; reason?: string };
  const adminId = admin.id ?? "admin";

  if (body.decision === "APPROVED") {
    // Mass-approve every credential for this artisan, then record the final decision.
    await trustRepository.massUpdateCredentials(artisanId, "APPROVED", adminId);
    await trustService.verifyIdentity(artisanId, adminId);
    await userRepository.updateArtisanProfile(artisanId, {
      verificationStatus: "VERIFIED",
      onboardingStatus: "ACTIVE",
      rejectionReason: null,
    });
    await authService.logAdminAction({
      adminId,
      action: "VERIFIED_IDENTITY",
      targetType: "Artisan",
      targetId: artisanId,
    });

  } else if (body.decision === "REJECTED") {
    if (!body.reason?.trim()) {
      return NextResponse.json(
        { error: "A rejection reason is required." },
        { status: 400 },
      );
    }

    // Mass-reject every credential for this artisan, then record the final decision.
    await trustRepository.massUpdateCredentials(artisanId, "REJECTED", adminId);
    await trustService.rejectIdentity(artisanId, adminId);
    await userRepository.updateArtisanProfile(artisanId, {
      verificationStatus: "REJECTED",
      rejectionReason: body.reason.trim(),
    });
    await authService.logAdminAction({
      adminId,
      action: "REJECTED_IDENTITY",
      targetType: "Artisan",
      targetId: artisanId,
      notes: body.reason.trim(),
    });

  } else if (body.decision === "REVOKED") {
    await trustService.revokeDecision(artisanId);
    await userRepository.updateArtisanProfile(artisanId, {
      verificationStatus: "UNVERIFIED",
      onboardingStatus: "PENDING_REVIEW",
      rejectionReason: null,
    });
    await authService.logAdminAction({
      adminId,
      action: "REVOKED_VERIFICATION",
      targetType: "Artisan",
      targetId: artisanId,
    });

  } else {
    return NextResponse.json(
      { error: "decision must be APPROVED, REJECTED, or REVOKED" },
      { status: 400 },
    );
  }

  revalidatePath("/admin", "layout");
  return NextResponse.json({ ok: true });
});
