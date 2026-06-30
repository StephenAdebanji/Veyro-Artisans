import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { matchingRepository } from "@/services/matching/matching.repository";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const disputes = await matchingRepository.listOpenDisputes();
  return NextResponse.json({ disputes });
}
