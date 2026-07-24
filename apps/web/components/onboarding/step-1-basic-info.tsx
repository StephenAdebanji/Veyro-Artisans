"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepFooter } from "./step-footer";
import { clearOnboardingArtisanId, getOnboardingArtisanId, setOnboardingArtisanId } from "./onboarding-storage";
import { clearAllDrafts, loadDraft, saveDraft } from "./onboarding-draft";

type Step1Draft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function Step1BasicInfo() {
  const router = useRouter();
  const { status } = useSession();

  // True when the user navigated back from a later step — account already exists.
  // We read this once at mount (component is ssr:false so localStorage is available).
  const alreadyRegistered = useMemo(() => !!getOnboardingArtisanId(), []);

  // Always start empty. Draft is loaded ONLY after we confirm the session is
  // "authenticated" (meaning the user is mid-wizard navigating back), never
  // for unauthenticated arrivals (fresh sign-up, or returning after drop-off).
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load draft only when session resolves to authenticated (= back navigation).
  useEffect(() => {
    if (status !== "authenticated" || draftLoaded) return;
    const draft = loadDraft<Step1Draft>(1);
    if (draft) {
      setForm((f) => ({
        ...f,
        firstName: draft.firstName ?? "",
        lastName: draft.lastName ?? "",
        email: draft.email ?? "",
        phone: draft.phone ?? "",
      }));
    }
    setDraftLoaded(true);
  }, [status, draftLoaded]);

  // For unauthenticated arrivals: ensure any stale localStorage is wiped.
  // (The /join-artisan entry page already does this, but guard here too in
  //  case the user arrives at /steps/1 directly by typing the URL.)
  useEffect(() => {
    if (status !== "unauthenticated") return;
    clearAllDrafts();
    clearOnboardingArtisanId();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return; // only persist during an active wizard session
    if (alreadyRegistered) return; // locked read-only view — nothing new to save
    saveDraft<Step1Draft>(1, {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
    });
  }, [status, alreadyRegistered, form.firstName, form.lastName, form.email, form.phone]);

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Account already created — just advance. Never re-register or accept a new password.
    if (alreadyRegistered) {
      router.push("/join-artisan/steps/2");
      return;
    }

    setError(null);
    setLoading(true);

    const response = await fetch("/api/artisans/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(typeof body?.error === "string" ? body.error : "Could not create your account.");
      setLoading(false);
      return;
    }

    const { artisanId } = await response.json();
    setOnboardingArtisanId(artisanId);

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });

    router.push("/join-artisan/steps/2");
  }

  // ── Returning user (back navigation) ──────────────────────────────────────
  // Account is already set up. Show details as read-only when we have them
  // (mid-wizard back navigation with draft data); otherwise just show the
  // prompt and the Continue button (arrived fresh via /join-artisan button).
  if (alreadyRegistered) {
    const hasData = !!(form.firstName || form.email);
    return (
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Your account is already set up. Click Continue to pick up where you left off.
        </p>
        {hasData && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>First name</Label>
              <Input value={form.firstName} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Last name</Label>
              <Input value={form.lastName} disabled />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} disabled />
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <StepFooter step={1} loading={loading} />
        </div>
      </form>
    );
  }

  // ── Fresh sign-up ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" autoComplete="off">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
        <Input id="firstName" placeholder="Emeka" value={form.firstName} onChange={update("firstName")} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lastName">Last name <span className="text-destructive">*</span></Label>
        <Input id="lastName" placeholder="Okafor" value={form.lastName} onChange={update("lastName")} required />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
        <Input
          id="email"
          type="email"
          autoComplete="off"
          placeholder="you@example.com"
          value={form.email}
          onChange={update("email")}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
        <Input id="phone" placeholder="+234..." value={form.phone} onChange={update("phone")} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={form.password}
          onChange={update("password")}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <StepFooter step={1} loading={loading} />
      </div>
    </form>
  );
}
