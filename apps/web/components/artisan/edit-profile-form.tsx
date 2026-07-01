"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AlertTriangle, CheckCircle2, Loader2, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditProfileFormProps {
  artisanId: string;
  email: string;
  initialData: {
    firstName: string;
    lastName: string;
    bio: string;
    serviceRadiusKm?: number;
    city: string;
    state: string;
  };
}

function LogDisputeSection() {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: description.trim() }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Failed to submit dispute. Please try again.");
    } else {
      setSubmitted(true);
      setDescription("");
    }
  }

  return (
    <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900 dark:bg-rose-950/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-rose-600" />
        <h2 className="text-base font-semibold">Log a dispute</h2>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Had an issue with a job or homeowner? Let us know and our team will investigate.
      </p>
      {submitted ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Dispute submitted — our team will be in touch.
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
          <div>
            <Button type="submit" disabled={submitting} className="bg-rose-600 hover:bg-rose-700">
              {submitting ? "Submitting…" : "Submit dispute"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

export function EditProfileForm({ artisanId, email, initialData }: EditProfileFormProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bio, setBio] = useState(initialData.bio);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(initialData.serviceRadiusKm?.toString() ?? "");
  const [city, setCity] = useState(initialData.city);
  const [state, setState] = useState(initialData.state);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const body: Record<string, unknown> = { bio, city, state };
      if (serviceRadiusKm) body.serviceRadiusKm = Number(serviceRadiusKm);

      const res = await fetch(`/api/artisans/${artisanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setError("Failed to save changes. Please try again.");
        return;
      }

      setSaved(true);
      router.refresh();
    });
  }

  const fullName = `${initialData.firstName} ${initialData.lastName}`.trim() || "—";

  return (
    <div className="flex flex-col gap-8">
      {/* Account info — read-only */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">Account information</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Your name and email cannot be changed.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Full name</Label>
            <Input value={fullName} disabled className="cursor-not-allowed opacity-60" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email address</Label>
            <Input value={email} disabled className="cursor-not-allowed opacity-60" />
          </div>
        </div>
      </section>

      {/* Editable profile details */}
      <form onSubmit={handleSubmit}>
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold">Profile &amp; availability</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Shown to homeowners and used for job matching.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Tell homeowners about your experience and what you specialise in…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="serviceRadiusKm">Service radius (km)</Label>
              <Input
                id="serviceRadiusKm"
                type="number"
                min={1}
                inputMode="numeric"
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(e.target.value)}
                placeholder="e.g. 20"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
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
      {/* Log a dispute */}
      <LogDisputeSection />

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
