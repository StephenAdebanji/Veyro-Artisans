import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";

const ROLE_PREFIXES: Record<string, "HOMEOWNER" | "ARTISAN" | "ADMIN"> = {
  "/homeowner": "HOMEOWNER",
  "/artisan": "ARTISAN",
  "/admin": "ADMIN",
};

/** Next.js 16 renamed `middleware.ts`/`export function middleware` to
 * `proxy.ts`/`export function proxy` — see node_modules/next/dist/docs
 * upgrading guide. Runs on the nodejs runtime only (no edge option here),
 * which is fine since `auth()` already needs Node for bcrypt/Prisma anyway. */
export async function proxy(request: Request) {
  const { pathname } = new URL(request.url);
  const matchedPrefix = Object.keys(ROLE_PREFIXES).find((prefix) => pathname.startsWith(prefix));
  if (!matchedPrefix) return NextResponse.next();

  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const requiredRole = ROLE_PREFIXES[matchedPrefix];
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== requiredRole) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/homeowner/:path*", "/artisan/:path*", "/admin/:path*"],
};
