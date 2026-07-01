import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authService } from "@/services/auth/auth.service";

class SuspendedError extends CredentialsSignin {
  code = "SUSPENDED";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
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
        if (!dbUser || (dbUser as { status?: string }).status === "SUSPENDED") {
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
