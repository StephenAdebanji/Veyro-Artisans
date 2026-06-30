"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditProfileFormProps {
  artisanId: string;
  initialData: {
    firstName: string;
    lastName: string;
    bio: string;
    hourlyRate?: number;
    serviceRadiusKm?: number;
    city: string;
    state: string;
  };
}

export function EditProfileForm({ artisanId, initialData }: EditProfileFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [bio, setBio] = useState(initialData.bio);
  const [hourlyRate, setHourlyRate] = useState(initialData.hourlyRate?.toString() ?? "");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(initialData.serviceRadiusKm?.toString() ?? "");
  const [city, setCity] = useState(initialData.city);
  const [state, setState] = useState(initialData.state);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const body: Record<string, unknown> = { firstName, lastName, bio, city, state };
      if (hourlyRate) body.hourlyRate = Number(hourlyRate);
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hourlyRate">Hourly rate (₦)</Label>
          <Input
            id="hourlyRate"
            type="number"
            min={0}
            inputMode="numeric"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="e.g. 5000"
          />
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Profile updated successfully
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
