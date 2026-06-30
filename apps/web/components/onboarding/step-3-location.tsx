"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepFooter } from "./step-footer";
import { getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep } from "./onboarding-api";

// Mapbox geocoding isn't wired yet (no token) — same fallback used for
// homeowner service requests, see components/dashboard/new-request-form.tsx.
const FALLBACK_LOCATION = { gpsLat: 6.5244, gpsLng: 3.3792 };

export function Step3Location() {
  const router = useRouter();
  const [form, setForm] = useState({ country: "Nigeria", state: "", city: "", lga: "", residentialAddress: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const artisanId = getOnboardingArtisanId();
    if (!artisanId) {
      setError("Your session expired — please start again from step 1.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await patchOnboardingStep(artisanId, 3, { ...form, ...FALLBACK_LOCATION });
      router.push("/join-artisan/steps/4");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="country">Country</Label>
        <Input id="country" value={form.country} onChange={update("country")} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="state">State</Label>
        <Input id="state" placeholder="Lagos" value={form.state} onChange={update("state")} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="city">City</Label>
        <Input id="city" placeholder="Lekki" value={form.city} onChange={update("city")} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lga">LGA</Label>
        <Input id="lga" placeholder="Eti-Osa" value={form.lga} onChange={update("lga")} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="residentialAddress">Residential address</Label>
        <Input
          id="residentialAddress"
          value={form.residentialAddress}
          onChange={update("residentialAddress")}
          required
        />
        <p className="text-xs text-muted-foreground">Private — only ever visible to VEYRO&apos;s trust team.</p>
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <StepFooter step={3} loading={loading} />
      </div>
    </form>
  );
}
