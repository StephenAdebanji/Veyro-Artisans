import { NextResponse } from "next/server";
import { notificationService } from "@/services/notification/notification.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const POST = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await notificationService.markRead(id);
  return NextResponse.json({ ok: true });
});
