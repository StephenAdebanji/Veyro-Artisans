import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { matchingRepository } from "@/services/matching/matching.repository";
import { withApiErrorHandling } from "@/platform/api-handler";

export const GET = withApiErrorHandling(async () => {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const disputes = await matchingRepository.listOpenDisputes();
  return NextResponse.json({ disputes });
});
