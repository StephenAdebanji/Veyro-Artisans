import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authService } from "@/services/auth/auth.service";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/session";

class SuspendedError extends CredentialsSignin {
  code = "SUSPENDED";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No middleware in this app, so a plain page/route `auth()` call can only
  // ever read the JWT — Next.js forbids Server Components from writing
  // cookies, so it can't silently extend the expiry just because a page
  // rendered. The JWT strategy re-signs with a fresh expiry on every real
  // /api/auth/session round-trip (see @auth/core's session action), so the
  // 30-minute idle timeout is enforced here as a hard cap, and only actually
  // stays alive because components/shared/idle-session-guard.tsx calls
  // session.update() — deliberately, only when there's been genuine recent
  // activity — to keep sliding it forward. Without that guard, every session
  // would hard-expire exactly maxAge after sign-in regardless of activity.
  session: { strategy: "jwt", maxAge: IDLE_TIMEOUT_MINUTES * 60 },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const password = typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!email || !password) return null;

        try {
          const user = await authService.verifyCredentials(email, password);
          return user ? { id: user.id, email: user.email, name: user.name ?? null, role: user.role } : null;
        } catch (err) {
          if (err instanceof Error && err.message === "SUSPENDED") {
            throw new SuspendedError();
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.name = (user as { name?: string | null }).name ?? token.name;
      }
      if (trigger === "update" && session) {
        if ((session as { name?: string }).name !== undefined) token.name = (session as { name?: string }).name;
        if ((session as { email?: string }).email !== undefined) token.email = (session as { email?: string }).email;
      }
      // On every token refresh after initial sign-in, kill the session if the user is suspended.
      // Returning null from the jwt callback invalidates the JWT in NextAuth v5.
      if (!user && token.sub) {
        const dbUser = await authService.getUserById(token.sub);
        const s = (dbUser as { status?: string } | undefined)?.status;
        if (!dbUser || s === "SUSPENDED" || s === "DELETED") {
          return null;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string | undefined;
        (session.user as { id?: string }).id = token.sub;
        session.user.name = (token.name as string | null | undefined) ?? session.user.name;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
});
