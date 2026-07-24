"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepFooter } from "./step-footer";
import { setOnboardingArtisanId } from "./onboarding-storage";

export function Step1BasicInfo() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
