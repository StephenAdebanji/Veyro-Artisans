import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { trustService } from "@/services/trust/trust.service";
import { authService } from "@/services/auth/auth.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const GET = withApiErrorHandling(async () => {
  const session = await auth();
  const admin = session?.user as { id?: string; role?: string } | undefined;
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pending = await trustService.listPendingCredentials();

  if (admin.id) {
    await Promise.all(
      pending.map((credential) =>
        authService.logAdminAction({
          adminId: admin.id as string,
          action: "VIEWED_CREDENTIAL",
          targetType: "Credential",
          targetId: credential.id,
        }),
      ),
    );
  }

  return NextResponse.json({ pending });
});
