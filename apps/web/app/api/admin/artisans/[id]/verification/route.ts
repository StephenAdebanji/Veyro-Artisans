import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";
import { userRepository } from "@/services/user/user.repository";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== "ADMIN") return null;
  return user;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: artisanId } = await params;
  const body = (await req.json()) as { decision: string };

  if (body.decision === "APPROVED") {
    await trustService.verifyIdentity(artisanId, admin.id ?? "admin");
    await userRepository.updateArtisanProfile(artisanId, {
      verificationStatus: "VERIFIED",
      onboardingStatus: "ACTIVE",
    });
  } else if (body.decision === "REJECTED") {
    await trustService.rejectIdentity(artisanId, admin.id ?? "admin");
    await userRepository.updateArtisanProfile(artisanId, { verificationStatus: "REJECTED" });
  } else if (body.decision === "REVOKED") {
    await trustService.revokeDecision(artisanId);
    await userRepository.updateArtisanProfile(artisanId, {
      verificationStatus: "UNVERIFIED",
      onboardingStatus: "PENDING_REVIEW",
    });
  } else {
    return NextResponse.json({ error: "decision must be APPROVED, REJECTED, or REVOKED" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
