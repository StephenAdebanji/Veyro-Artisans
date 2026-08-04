"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { SKILL_CATEGORIES, SKILL_LABELS } from "@/components/shared/skill-labels";
import { COUNTRIES, NIGERIAN_STATES, NIGERIAN_LGAS } from "@/lib/location-data";
import { apiFetch } from "@/lib/api-client";
import type { SkillCategory } from "@veyro/contracts";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const NIGERIAN_STATE_OPTIONS = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

type AddressMode = "default" | "secondary";

interface DefaultAddress {
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export function NewRequestForm({ defaultAddress }: { defaultAddress?: DefaultAddress }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasDefaultAddress = !!(defaultAddress?.address && defaultAddress?.state);

  const [category, setCategory] = useState<SkillCategory | "">(
    (searchParams.get("category") as SkillCategory) ?? "",
  );
  // Carried over when re-posting a request that got no offers (see the
  // "Post again" button on the matching screen) — a blank "Post a new
  // request" navigation simply won't have these params set.
  const [description, setDescription] = useState(searchParams.get("description") ?? "");
  const [addressMode, setAddressMode] = useState<AddressMode>("default");
  const [countryCode, setCountryCode] = useState("NG");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [streetAddress, setStreetAddress] = useState(searchParams.get("streetAddress") ?? "");
  const [budgetMin, setBudgetMin] = useState(searchParams.get("budgetMin") ?? "");
  const [budgetMax, setBudgetMax] = useState(searchParams.get("budgetMax") ?? "");
  // Defaults to today so the field is genuinely filled from the start —
  // native date inputs visually hint at today's date before it's actually
  // picked, which made the field look filled while still being empty and
  // failing "required" validation on submit.
  const [preferredDate, setPreferredDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const todayISO = new Date().toISOString().split("T")[0];
  const isNigeria = countryCode === "NG";
  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);

  const defaultAddressLabel = [
    defaultAddress?.address,
    defaultAddress?.city,
    defaultAddress?.state,
    defaultAddress?.country,
  ]
    .filter(Boolean)
    .join(", ");

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

    if (addressMode === "default") {
      if (!hasDefaultAddress) {
        setError("Add your address in Account settings before using your default address.");
        return;
      }
    } else {
      if (!state) { setError("Choose a state / region."); return; }
      if (!streetAddress.trim()) { setError("Enter a street address."); return; }
    }

    if (!budgetMin) { setError("Enter a minimum budget."); return; }
    if (!budgetMax) { setError("Enter a maximum budget."); return; }
    if (Number(budgetMin) < 500) {
      setError("Minimum budget cannot be less than ₦500.");
      return;
    }
    if (Number(budgetMax) < Number(budgetMin)) {
      setError("Maximum budget cannot be less than the minimum budget.");
      return;
    }
    if (!preferredDate) { setError("Choose a preferred date."); return; }
    if (preferredDate < todayISO) {
      setError("Preferred date cannot be in the past.");
      return;
    }
    setError(null);
    setLoading(true);

    const addressPayload =
      addressMode === "default"
        ? {
            streetAddress: (defaultAddress?.address ?? "").trim(),
            lga: defaultAddress?.city || undefined,
            state: defaultAddress?.state ?? "",
            country: defaultAddress?.country ?? "Nigeria",
            countryCode: COUNTRIES.find((c) => c.name === defaultAddress?.country)?.code ?? "NG",
          }
        : {
            streetAddress: streetAddress.trim(),
            lga: lga || undefined,
            state,
            country: selectedCountry?.name ?? "Nigeria",
            countryCode,
          };

    try {
      const { serviceRequestId } = await apiFetch<{ serviceRequestId: string }>("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          ...addressPayload,
          budgetMin: Number(budgetMin),
          budgetMax: Number(budgetMax),
          preferredDate: preferredDate || undefined,
        }),
      });
      router.push(`/homeowner/requests/${serviceRequestId}/matching`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the request.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Service category */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">
          Service category <span className="text-destructive">*</span>
        </Label>
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
        <Label htmlFor="description">
          Describe the job <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="e.g. Kitchen sockets aren't holding power"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </div>

      {/* Address mode */}
      <div className="flex flex-col gap-2">
        <Label>Job address</Label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={addressMode === "default"}
            onCheckedChange={(checked) => { if (checked) setAddressMode("default"); }}
          />
          Use default address
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={addressMode === "secondary"}
            onCheckedChange={(checked) => { if (checked) setAddressMode("secondary"); }}
          />
          Use a secondary address
        </label>
      </div>

      {addressMode === "default" &&
        (hasDefaultAddress ? (
          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{defaultAddressLabel}</span>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            You haven&apos;t added an address in Account settings yet.{" "}
            <Link href="/homeowner/account" className="font-medium underline underline-offset-2">
              Complete your profile
            </Link>{" "}
            or use a secondary address below.
          </div>
        ))}

      {addressMode === "secondary" && (
        <>
          <p className="text-xs text-muted-foreground">
            This address is only used for this request — it won&apos;t be saved to your account.
          </p>

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
            <Label htmlFor={isNigeria ? undefined : "state"}>
              State <span className="text-destructive">*</span>
            </Label>
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
            <Label htmlFor="streetAddress">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="streetAddress"
              placeholder="12 Admiralty Way, Lekki Phase 1"
              value={streetAddress}
              onChange={(event) => setStreetAddress(event.target.value)}
              required
            />
          </div>
        </>
      )}

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budgetMin">
            Budget min (₦) <span className="text-destructive">*</span>
          </Label>
          <CurrencyInput id="budgetMin" value={budgetMin} onValueChange={setBudgetMin} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budgetMax">
            Budget max (₦) <span className="text-destructive">*</span>
          </Label>
          <CurrencyInput id="budgetMax" value={budgetMax} onValueChange={setBudgetMax} required />
        </div>
      </div>

      {/* Preferred date */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="preferredDate">
          Preferred date <span className="text-destructive">*</span>
        </Label>
        <Input
          id="preferredDate"
          type="date"
          min={todayISO}
          value={preferredDate}
          onChange={(event) => setPreferredDate(event.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? "Submitting…" : "Find artisans"}
      </Button>
    </form>
  );
}
