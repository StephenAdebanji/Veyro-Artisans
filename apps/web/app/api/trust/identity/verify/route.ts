import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";

const verifySchema = z.object({ artisanId: z.string() });

export async function POST(request: Request) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const adminId = (session!.user as { id?: string }).id ?? "unknown-admin";
  await trustService.verifyIdentity(parsed.data.artisanId, adminId);
  return NextResponse.json({ ok: true });
}
