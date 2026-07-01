import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authService } from "@/services/auth/auth.service";

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
            throw new Error("SUSPENDED");
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
      // updateSession() call — merge provided values into the token.
      if (trigger === "update" && session) {
        if ((session as { name?: string }).name !== undefined) token.name = (session as { name?: string }).name;
        if ((session as { email?: string }).email !== undefined) token.email = (session as { email?: string }).email;
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
