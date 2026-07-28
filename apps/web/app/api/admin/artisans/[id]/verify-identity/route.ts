import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const POST = withApiErrorHandling(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth();
  const adminUser = session?.user as { id?: string; role?: string } | undefined;
  if (adminUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: artisanId } = await params;
  await trustService.verifyIdentity(artisanId, adminUser.id ?? "admin");
  revalidatePath("/admin", "layout");
  return NextResponse.json({ ok: true });
});
