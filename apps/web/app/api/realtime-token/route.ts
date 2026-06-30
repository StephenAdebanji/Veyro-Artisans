import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { issueRealtimeToken } from "@/platform/realtime-token";

/** Short-lived token the browser exchanges for a Socket.io connection.
 * The client calls this once on mount, then passes the token in the socket
 * handshake — apps/realtime verifies it independently so it never needs
 * to share the NextAuth secret. */
export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || !user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.role as "HOMEOWNER" | "ARTISAN" | "ADMIN";
  const token = issueRealtimeToken({ userId: user.id, role });
  return NextResponse.json({ token });
}
