import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { userRepository } from "@/services/user/user.repository";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const homeowners = await userRepository.listAllHomeowners();
  return NextResponse.json(homeowners);
}
