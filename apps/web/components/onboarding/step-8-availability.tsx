"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepFooter } from "./step-footer";
import { clearOnboardingArtisanId, getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep, submitOnboarding } from "./onboarding-api";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function Step8Availability() {
  const router = useRouter();
  const [workingDays, setWorkingDays] = useState<string[]>(["MON", "TUE", "WED", "THU", "FRI", "SAT"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleDay(day: string) {
    setWorkingDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day],
    );
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
      await patchOnboardingStep(artisanId, 8, { workingDays, startTime, endTime, emergencyAvailable });
      await submitOnboarding(artisanId);
      clearOnboardingArtisanId();
      router.push("/join-artisan/submitted");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label>Working days</Label>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((day) => (
            <label key={day} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm">
              <Checkbox checked={workingDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
              {day[0] + day.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startTime">Working hours (start)</Label>
          <Input id="startTime" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endTime">Working hours (end)</Label>
          <Input id="endTime" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <Checkbox checked={emergencyAvailable} onCheckedChange={(checked) => setEmergencyAvailable(checked === true)} />
        Available for emergency jobs (24/7 surcharge)
      </label>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <StepFooter step={8} loading={loading} continueLabel="Submit" />
    </form>
  );
}
