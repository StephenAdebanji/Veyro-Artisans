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
  const init = useMemo(() => loadDraft<Step1Draft>(1), []);

  const [form, setForm] = useState({
    firstName: init?.firstName ?? "",
    lastName: init?.lastName ?? "",
    email: init?.email ?? "",
    phone: init?.phone ?? "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If the user is not authenticated but localStorage has a stale artisanId
  // from a previous incomplete session, wipe it so every new visitor starts
  // with a fresh form. (Authenticated back-navigation keeps the draft.)
  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (!getOnboardingArtisanId()) return;
    clearAllDrafts();
    clearOnboardingArtisanId();
    setForm({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  }, [status]);

  useEffect(() => {
    if (alreadyRegistered) return; // don't overwrite draft with locked field values
    saveDraft<Step1Draft>(1, {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
    });
  }, [alreadyRegistered, form.firstName, form.lastName, form.email, form.phone]);

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
  // Account is already set up. Show details as read-only and hide the
  // password field entirely — there is no password to set or change here.
  if (alreadyRegistered) {
    return (
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Your account is already set up. Click Continue to pick up where you left off.
        </p>
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
