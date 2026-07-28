import { NextResponse } from "next/server";
import { notificationService } from "@/services/notification/notification.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const GET = withApiErrorHandling(async (request: Request) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const unreadOnly = url.searchParams.get("unreadOnly") === "true";
  const notifications = await notificationService.listForUser(userId, { unreadOnly });
  return NextResponse.json({ notifications });
});
