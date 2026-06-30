import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { authRepository } from "@/services/auth/auth.repository";
import { userRepository } from "@/services/user/user.repository";
import { matchingRepository } from "@/services/matching/matching.repository";
import { trustService } from "@/services/trust/trust.service";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, verifiedArtisans, activeRequests, openDisputes, pending] = await Promise.all([
    authRepository.countAll(),
    userRepository.countVerifiedArtisans(),
    matchingRepository.countAllServiceRequests(),
    matchingRepository.countOpenDisputes(),
    trustService.listPendingCredentials(),
  ]);

  return NextResponse.json({
    totalUsers,
    verifiedArtisans,
    activeRequests,
    openDisputes,
    pendingVerifications: pending.length,
  });
}
