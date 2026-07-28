import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";
import { trustRepository } from "@/services/trust/trust.repository";
import { withApiErrorHandling } from "@/platform/api-handler";

const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional(),
});

export const PATCH = withApiErrorHandling(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: credentialId } = await params;
  const credential = await trustRepository.findCredential(credentialId);
  if (!credential) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const adminId = (session!.user as { id?: string }).id ?? "unknown-admin";
  await trustService.reviewCredential(credentialId, parsed.data.decision, adminId, parsed.data.reason);
  return NextResponse.json({ ok: true });
});
