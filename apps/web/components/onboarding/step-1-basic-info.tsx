"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepFooter } from "./step-footer";
import { clearOnboardingArtisanId, getOnboardingArtisanId, setOnboardingArtisanId } from "./onboarding-storage";
import { clearAllDrafts, loadDraft, saveDraft } from "./onboarding-draft";
import { apiFetch } from "@/lib/api-client";

type Step1Draft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function Step1BasicInfo() {
  const router = useRouter();
  const { status } = useSession();

  // True only after the session confirms "authenticated" AND artisanId exists in
  // localStorage. Starting from false means unauthenticated visitors (fresh
  // sign-ups, returning drop-offs) NEVER see the "already set up" banner even
  // if stale localStorage data is present — it only appears for mid-wizard
  // back navigation where the session is active.
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Session resolved to authenticated = user is mid-wizard navigating back.
  // Only now do we: (a) flag the account as already registered, and
  // (b) load the saved draft into the form.
  useEffect(() => {
    if (status !== "authenticated" || draftLoaded) return;
    if (getOnboardingArtisanId()) setAlreadyRegistered(true);
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
    setConsentError(null);
    if (!agreedToTerms) {
      setConsentError("You must agree to the Terms of Use and Privacy Policy to continue.");
      return;
    }
    setLoading(true);

    try {
      const { artisanId } = await apiFetch<{ artisanId: string }>("/api/artisans/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setOnboardingArtisanId(artisanId);

      await signIn("credentials", { email: form.email, password: form.password, redirect: false });

      router.push("/join-artisan/steps/2");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
      setLoading(false);
    }
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
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={agreedToTerms}
            onCheckedChange={(checked) => {
              setAgreedToTerms(checked === true);
              setConsentError(null);
            }}
            aria-invalid={!!consentError}
            className="mt-0.5"
          />
          <span>
            I agree to VEYRO&apos;s{" "}
            <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
            , including the collection and use of my personal data as described.
          </span>
        </label>
        {consentError && <p className="text-xs text-destructive">{consentError}</p>}
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <StepFooter step={1} loading={loading} />
      </div>
    </form>
  );
}
