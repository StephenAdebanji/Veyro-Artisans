"use client";

import { useState } from "react";
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
import { SKILL_CATEGORIES, SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";

// Lagos city-centre fallback — Mapbox geocoding isn't wired yet (no token),
// so every request gets this placeholder location until Phase 5+ adds real
// address→coordinates lookup via platform/mapbox.ts.
const FALLBACK_LOCATION = { lat: 6.5244, lng: 3.3792 };

export function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<SkillCategory | "">(
    (searchParams.get("category") as SkillCategory) ?? "",
  );
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!category) {
      setError("Choose a category.");
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
        address,
        location: FALLBACK_LOCATION,
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Location</Label>
        <Input
          id="address"
          placeholder="12 Admiralty Way, Lekki Phase 1, Lagos"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budgetMin">Budget min (₦)</Label>
          <Input
            id="budgetMin"
            type="number"
            min={0}
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="preferredDate">Preferred date</Label>
        <Input
          id="preferredDate"
          type="date"
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
