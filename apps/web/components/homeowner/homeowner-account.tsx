"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  UserCircle,
  Settings2,
  AlertOctagon,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ProfilePhotoUpload } from "@/components/shared/profile-photo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { COUNTRIES, NIGERIAN_STATES, NIGERIAN_LGAS } from "@/lib/location-data";
import { apiFetch } from "@/lib/api-client";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.name, label: c.name }));
const NIGERIAN_STATE_OPTIONS = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

type Tab = "profile" | "disputes" | "settings";

interface HomeownerAccountProps {
  email: string;
  fullName: string;
  profilePhotoUrl: string | null;
  initial: { phone: string; address: string; city: string; state: string; country: string };
}

function LogDisputeSection() {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      setSubmitted(true);
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900 dark:bg-rose-950/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-rose-600" />
        <h2 className="text-base font-semibold">Log a dispute</h2>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Had an issue with a job or artisan? Let us know.
      </p>
      {submitted ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Dispute submitted — our team will be in touch.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <textarea
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            rows={3}
            placeholder="Describe the issue in detail…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-fit bg-rose-600 hover:bg-rose-700">
            {submitting ? "Submitting…" : "Submit dispute"}
          </Button>
        </form>
      )}
    </section>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="text-base font-semibold">Appearance</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Choose how VEYRO looks for you.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {([
          { value: "light", icon: Sun, label: "Light" },
          { value: "dark", icon: Moon, label: "Dark" },
          { value: "system", icon: Monitor, label: "System" },
        ] as const).map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              theme === value ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function HomeownerAccount({ email, fullName, profilePhotoUrl, initial }: HomeownerAccountProps) {
  const [tab, setTab] = useState<Tab>("profile");
  const [phone, setPhone] = useState(initial.phone);
  const [country, setCountry] = useState(initial.country);
  const [state, setState] = useState(initial.state);
  const [lga, setLga] = useState(initial.city);
  const [address, setAddress] = useState(initial.address);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNigeria = country === "Nigeria";

  const lgaOptions = useMemo(
    () => (state && isNigeria ? (NIGERIAN_LGAS[state] ?? []).map((l) => ({ value: l, label: l })) : []),
    [state, isNigeria],
  );

  function handleCountryChange(value: string) {
    setCountry(value);
    setState("");
    setLga("");
    setSaved(false);
  }

  function handleStateChange(s: string) {
    setState(s);
    setLga("");
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state) { setError("Choose your state of residence."); return; }
    if (!address.trim()) { setError("Enter your address."); return; }
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/homeowners/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, address: address.trim(), city: lga || undefined, state, country }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-2xl flex-1 px-6 pb-16 pt-10">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl border bg-muted/40 p-1">
        {([
          { id: "profile" as Tab, icon: UserCircle, label: "Profile" },
          { id: "disputes" as Tab, icon: AlertOctagon, label: "Disputes" },
          { id: "settings" as Tab, icon: Settings2, label: "Settings" },
        ]).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === id ? "bg-white shadow-sm dark:bg-card" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {tab === "profile" && (
          <>
            {/* Profile photo */}
            <section className="flex items-center gap-5 rounded-xl border bg-card p-6">
              <ProfilePhotoUpload
                currentUrl={profilePhotoUrl}
                name={fullName}
                endpoint="/api/homeowners/profile"
                size={80}
              />
              <div>
                <p className="font-semibold">{fullName || "—"}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
                <p className="mt-1 text-xs text-muted-foreground">Click the camera icon to update your photo</p>
              </div>
            </section>

            {/* Account info (read-only) */}
            <section className="rounded-xl border bg-card p-6">
              <h2 className="text-base font-semibold">Account information</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Your name and email cannot be changed.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Full name</Label>
                  <Input value={fullName || "—"} disabled className="cursor-not-allowed opacity-60" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Email address</Label>
                  <Input value={email} disabled className="cursor-not-allowed opacity-60" />
                </div>
              </div>
            </section>

            {/* Phone (editable) */}
            <form onSubmit={handleSubmit}>
              <section className="rounded-xl border bg-card p-6">
                <h2 className="text-base font-semibold">Contact</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Your phone number is shared with artisans only after they are hired.
                </p>
                <div className="mt-4 flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+234 800 000 0000"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setSaved(false); }}
                  />
                </div>
                <div className="mt-4 flex flex-col gap-1.5">
                  <Label>Country</Label>
                  <SearchableSelect
                    options={COUNTRY_OPTIONS}
                    value={country}
                    onChange={handleCountryChange}
                    placeholder="Select country"
                    searchPlaceholder="Search countries…"
                  />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={isNigeria ? undefined : "state"}>
                      State of residence <span className="text-destructive">*</span>
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
                        onChange={(e) => { setState(e.target.value); setLga(""); setSaved(false); }}
                      />
                    )}
                  </div>
                  {isNigeria && (
                    <div className="flex flex-col gap-1.5">
                      <Label>Local Government Area</Label>
                      <SearchableSelect
                        options={lgaOptions}
                        value={lga}
                        onChange={(value) => { setLga(value); setSaved(false); }}
                        placeholder="Select LGA"
                        searchPlaceholder="Search LGAs…"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-1.5">
                  <Label htmlFor="address">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="12 Admiralty Way, Lekki Phase 1"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setSaved(false); }}
                  />
                </div>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                <div className="mt-4 flex items-center gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                  {saved && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Saved
                    </span>
                  )}
                </div>
              </section>
            </form>
          </>
        )}

        {tab === "disputes" && <LogDisputeSection />}

        {tab === "settings" && <AppearanceSection />}
      </div>
    </div>
  );
}
