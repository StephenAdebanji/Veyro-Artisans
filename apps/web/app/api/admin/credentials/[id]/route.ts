import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";
import { authService } from "@/services/auth/auth.service";
import { prisma } from "@/platform/prisma";
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

  const { id } = await params;
  const body = (await req.json()) as { decision: string };
  if (body.decision !== "APPROVED" && body.decision !== "REJECTED") {
    return NextResponse.json({ error: "decision must be APPROVED or REJECTED" }, { status: 400 });
  }

  await trustService.reviewCredential(id, body.decision, admin.id ?? "admin");

  if (admin.id) {
    await authService.logAdminAction({
      adminId: admin.id,
      action: body.decision === "APPROVED" ? "APPROVED_CREDENTIAL" : "REJECTED_CREDENTIAL",
      targetType: "Credential",
      targetId: id,
    });
  }

  revalidatePath("/admin", "layout");
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiErrorHandling(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.credential.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  return NextResponse.json({ ok: true });
});
