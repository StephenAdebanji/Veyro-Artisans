"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { EXPERIENCE_LABELS, SKILL_CATEGORIES, SKILL_LABELS } from "@/components/shared/skill-labels";
import type { ExperienceLevel, SkillCategory } from "@veyro/contracts";
import { StepFooter } from "./step-footer";
import { getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep } from "./onboarding-api";
import { loadDraft, saveDraft } from "./onboarding-draft";

type Step2Draft = {
  profilePhotoUrl: string | null;
  primarySkill: SkillCategory | "";
  secondarySkills: string;
  experienceLevel: ExperienceLevel | "";
  serviceRadiusKm: string;
  bio: string;
};

const EXPERIENCE_OPTIONS: ExperienceLevel[] = ["0-2", "3-5", "6-10", "10+"];

export function Step2Professional() {
  const router = useRouter();
  // Loaded once on first client-only mount — ssr: false in page.tsx ensures window is available.
  const init = useMemo(() => loadDraft<Step2Draft>(2), []);

  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(init?.profilePhotoUrl ?? null);
  const [primarySkill, setPrimarySkill] = useState<SkillCategory | "">(init?.primarySkill ?? "");
  const [secondarySkills, setSecondarySkills] = useState(init?.secondarySkills ?? "");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(init?.experienceLevel ?? "");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(init?.serviceRadiusKm ?? "10");
  const [bio, setBio] = useState(init?.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveDraft<Step2Draft>(2, { profilePhotoUrl, primarySkill, secondarySkills, experienceLevel, serviceRadiusKm, bio });
  }, [profilePhotoUrl, primarySkill, secondarySkills, experienceLevel, serviceRadiusKm, bio]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const artisanId = getOnboardingArtisanId();
    if (!artisanId) {
      setError("Your session expired — please start again from step 1.");
      return;
    }
    if (!primarySkill || !experienceLevel) {
      setError("Choose a primary skill and experience level.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await patchOnboardingStep(artisanId, 2, {
        profilePhotoUrl,
        primarySkill,
        secondarySkills: secondarySkills
          .split(",")
          .map((skill) => skill.trim().toUpperCase().replace(/\s+/g, "_"))
          .filter(Boolean),
        experienceLevel,
        serviceRadiusKm: Number(serviceRadiusKm),
        bio,
      });
      router.push("/join-artisan/steps/3");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>Profile photo</Label>
        <FileUpload
          key={`photo-${init?.profilePhotoUrl ?? "empty"}`}
          uploadType="profile-photo"
          label="Click to upload"
          initialUrl={init?.profilePhotoUrl ?? null}
          onUploaded={(url) => setProfilePhotoUrl(url)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Primary skill <span className="text-destructive">*</span></Label>
        <Select value={primarySkill} onValueChange={(value) => setPrimarySkill(value as SkillCategory)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a skill" />
          </SelectTrigger>
          <SelectContent>
            {SKILL_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {SKILL_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="secondarySkills">Secondary skills</Label>
        <Input
          id="secondarySkills"
          placeholder="e.g. Wiring, Inverter"
          value={secondarySkills}
          onChange={(event) => setSecondarySkills(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Experience <span className="text-destructive">*</span></Label>
        <Select value={experienceLevel} onValueChange={(value) => setExperienceLevel(value as ExperienceLevel)}>
          <SelectTrigger>
            <SelectValue placeholder="Select experience" />
          </SelectTrigger>
          <SelectContent>
            {EXPERIENCE_OPTIONS.map((level) => (
              <SelectItem key={level} value={level}>
                {EXPERIENCE_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="serviceRadiusKm">Service radius (km)</Label>
        <Input
          id="serviceRadiusKm"
          type="number"
          min={1}
          value={serviceRadiusKm}
          onChange={(event) => setServiceRadiusKm(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell homeowners about your craft."
          value={bio}
          onChange={(event) => setBio(event.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <StepFooter step={2} loading={loading} />
      </div>
    </form>
  );
}
