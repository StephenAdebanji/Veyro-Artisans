"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsFormProps {
  email: string;
  fullName: string;
  initial: {
    phone: string;
    address: string;
    city: string;
    state: string;
  };
}

export function SettingsForm({ email, fullName, initial }: SettingsFormProps) {
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setSaved(false);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/homeowners/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Failed to save. Please try again.");
    } else {
      setSaved(true);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Account info */}
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

      {/* Editable contact details */}
      <form onSubmit={handleSubmit}>
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold">Contact &amp; address</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Used to match you with nearby artisans.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                placeholder="+234 800 000 0000"
                value={form.phone}
                onChange={update("phone")}
                autoComplete="tel"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="address">Street address</Label>
              <Input
                id="address"
                placeholder="12 Adeola Odeku Street"
                value={form.address}
                onChange={update("address")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Lagos"
                value={form.city}
                onChange={update("city")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Lagos State"
                value={form.state}
                onChange={update("state")}
              />
            </div>
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

      {/* Appearance */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">Appearance</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Choose how VEYRO looks for you.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {(
            [
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "System" },
            ] as const
          ).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                theme === value
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
