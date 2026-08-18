"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

const ROLE_REDIRECT: Record<string, string> = {
  HOMEOWNER: "/homeowner/dashboard",
  ARTISAN: "/artisan/dashboard",
  ADMIN: "/admin/console",
};

export function SignInForm({ reason }: { reason?: string }) {
  const router = useRouter();
  const idleSignOut = reason === "idle";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Browser autofill fires after React's initial render — useEffect clears
  // whatever the browser injected when arriving from an idle sign-out.
  useEffect(() => {
    if (!idleSignOut) return;
    setEmail("");
    setPassword("");
  }, [idleSignOut]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      if (result.code === "SUSPENDED") {
        setError("Your account has been suspended. Please contact support at support@veyro.app.");
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role ?? "HOMEOWNER";
    router.push(ROLE_REDIRECT[role] ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          // "username" (the WHATWG-recommended token for a login identifier)
          // is what tells the browser this is the field to anchor its saved-
          // credentials dropdown to — pairs with "current-password" below.
          autoComplete={idleSignOut ? "off" : "username"}
          placeholder="you@home.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          // "current-password", not "new-password" — this is a sign-in form,
          // not account creation. "new-password" was actively wrong here: it
          // told the browser not to treat this as a fillable login field, so
          // it fell back to showing its account-picker on the password field
          // instead of the email field where it belongs.
          autoComplete={idleSignOut ? "off" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" disabled={loading} className="mt-1">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
