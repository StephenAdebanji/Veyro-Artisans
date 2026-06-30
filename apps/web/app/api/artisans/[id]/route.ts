import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";

/** Public artisan profile. residentialAddress/gps are stripped unless the
 * requester is an authenticated admin — see UserServicePort.getArtisanProfile. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const profile = await userService.getArtisanProfile(id, { includePrivate: isAdmin });
  if (!profile) {
    return NextResponse.json({ error: "Artisan not found" }, { status: 404 });
  }

  return NextResponse.json({ artisan: profile });
}
