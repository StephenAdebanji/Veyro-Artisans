"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SKILL_CATEGORIES, SKILL_LABELS } from "@/components/shared/skill-labels";
import { COUNTRIES, NIGERIAN_STATES, NIGERIAN_LGAS } from "@/lib/location-data";
import type { SkillCategory } from "@veyro/contracts";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const NIGERIAN_STATE_OPTIONS = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

export function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<SkillCategory | "">(
    (searchParams.get("category") as SkillCategory) ?? "",
  );
  const [description, setDescription] = useState("");
  const [countryCode, setCountryCode] = useState("NG");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const todayISO = new Date().toISOString().split("T")[0];
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
    if (!category) { setError("Choose a category."); return; }
    if (!state) { setError("Choose a state / region."); return; }
    if (!streetAddress.trim()) { setError("Enter a street address."); return; }
    if (budgetMin && Number(budgetMin) < 500) {
      setError("Minimum budget cannot be less than ₦500.");
      return;
    }
    if (preferredDate && preferredDate < todayISO) {
      setError("Preferred date cannot be in the past.");
      return;
    }
    setError(null);
    setLoading(true);

    const response = await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        description,
        streetAddress: streetAddress.trim(),
        lga: lga || undefined,
        state,
        country: selectedCountry?.name ?? "Nigeria",
        countryCode,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        preferredDate: preferredDate || undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(typeof body?.error === "string" ? body.error : "Could not create the request.");
      setLoading(false);
      return;
    }

    const { serviceRequestId } = (await response.json()) as { serviceRequestId: string };
    router.push(`/homeowner/requests/${serviceRequestId}/matching`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Service category */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Service category</Label>
        <Select value={category} onValueChange={(value) => setCategory(value as SkillCategory)}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {SKILL_CATEGORIES.map((value) => (
              <SelectItem key={value} value={value}>
                {SKILL_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Job description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Describe the job</Label>
        <Textarea
          id="description"
          placeholder="e.g. Kitchen sockets aren't holding power"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </div>

      {/* Country */}
      <div className="flex flex-col gap-1.5">
        <Label>Country of Residence</Label>
        <SearchableSelect
          options={COUNTRY_OPTIONS}
          value={countryCode}
          onChange={handleCountryChange}
          placeholder="Select country"
          searchPlaceholder="Search countries…"
        />
      </div>

      {/* State — Nigerian dropdown or free text for other countries */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="state">State</Label>
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
            id="state"
            placeholder="State / Province / Region"
            value={state}
            onChange={(e) => { setState(e.target.value); setLga(""); }}
            required
          />
        )}
      </div>

      {/* LGA — only for Nigeria, only after state is chosen */}
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

      {/* Street address */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="streetAddress">Address</Label>
        <Input
          id="streetAddress"
          placeholder="12 Admiralty Way, Lekki Phase 1"
          value={streetAddress}
          onChange={(event) => setStreetAddress(event.target.value)}
          required
        />
      </div>

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budgetMin">Budget min (₦)</Label>
          <Input
            id="budgetMin"
            type="number"
            min={500}
            value={budgetMin}
            onChange={(event) => setBudgetMin(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budgetMax">Budget max (₦)</Label>
          <Input
            id="budgetMax"
            type="number"
            min={0}
            value={budgetMax}
            onChange={(event) => setBudgetMax(event.target.value)}
          />
        </div>
      </div>

      {/* Preferred date */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="preferredDate">Preferred date</Label>
        <Input
          id="preferredDate"
          type="date"
          min={todayISO}
          value={preferredDate}
          onChange={(event) => setPreferredDate(event.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? "Submitting…" : "Find artisans"}
      </Button>
    </form>
  );
}
