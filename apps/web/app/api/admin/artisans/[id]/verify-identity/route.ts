import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const adminUser = session?.user as { id?: string; role?: string } | undefined;
  if (adminUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: artisanId } = await params;
  await trustService.verifyIdentity(artisanId, adminUser.id ?? "admin");
  return NextResponse.json({ ok: true });
}
