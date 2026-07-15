"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StepFooter } from "./step-footer";
import { getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep } from "./onboarding-api";
import { COUNTRIES, NIGERIAN_STATES, NIGERIAN_LGAS } from "@/lib/location-data";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const NIGERIAN_STATE_OPTIONS = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

export function Step3Location() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("NG");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isNigeria = countryCode === "NG";
  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);

  const lgaOptions = useMemo(
    () => (state && isNigeria ? (NIGERIAN_LGAS[state] ?? []).map((l) => ({ value: l, label: l })) : []),
    [state, isNigeria],
  );

  function handleCountryChange(code: string) {
    setCountryCode(code);
    setState("");
    setLga("");
  }

  function handleStateChange(s: string) {
    setState(s);
    setLga("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!state) { setError("Please select a state."); return; }
    if (!residentialAddress.trim()) { setError("Please enter your residential address."); return; }

    const artisanId = getOnboardingArtisanId();
    if (!artisanId) {
      setError("Your session expired — please start again from step 1.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await patchOnboardingStep(artisanId, 3, {
        country: selectedCountry?.name ?? "Nigeria",
        // Pass the ISO code so the server can geocode with it directly
        countryCode,
        state,
        city: lga || state,
        lga: lga || undefined,
        residentialAddress: residentialAddress.trim(),
      });
      router.push("/join-artisan/steps/4");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Country */}
      <div className="flex flex-col gap-1.5">
        <Label>Country</Label>
        <SearchableSelect
          options={COUNTRY_OPTIONS}
          value={countryCode}
          onChange={handleCountryChange}
          placeholder="Select country"
          searchPlaceholder="Search countries…"
        />
      </div>

      {/* State */}
      <div className="flex flex-col gap-1.5">
        <Label>State</Label>
        {isNigeria ? (
          <SearchableSelect
            options={NIGERIAN_STATE_OPTIONS}
            value={state}
            onChange={handleStateChange}
            placeholder="Select state"
            searchPlaceholder="Search states…"
          />
        ) : (
          <Input
            placeholder="State / Province / Region"
            value={state}
            onChange={(e) => { setState(e.target.value); setLga(""); }}
            required
          />
        )}
      </div>

      {/* LGA — only for Nigeria */}
      {isNigeria && state && (
        <div className="flex flex-col gap-1.5">
          <Label>Local Government Area</Label>
          <SearchableSelect
            options={lgaOptions}
            value={lga}
            onChange={setLga}
            placeholder="Select LGA"
            searchPlaceholder="Search LGAs…"
          />
        </div>
      )}

      {/* Residential address */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="residentialAddress">Residential address</Label>
        <Input
          id="residentialAddress"
          placeholder="12 Admiralty Way, Lekki Phase 1"
          value={residentialAddress}
          onChange={(e) => setResidentialAddress(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">Private — only ever visible to VEYRO&apos;s trust team.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <StepFooter step={3} loading={loading} />
    </form>
  );
}
