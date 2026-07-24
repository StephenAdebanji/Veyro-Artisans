"use client";

import { useEffect } from "react";
import { saveDraft } from "./onboarding-draft";
import { setOnboardingArtisanId } from "./onboarding-storage";

// DB enum → contract value (mirrors services/user/experience-level.map.ts)
const EXP_FROM_DB: Record<string, string> = {
  ZERO_TO_TWO: "0-2",
  THREE_TO_FIVE: "3-5",
  SIX_TO_TEN: "6-10",
  TEN_PLUS: "10+",
};

/**
 * Runs on mount when the artisan layout redirects an incomplete artisan back
 * to their last onboarding step (sign-in resume flow).
 *
 * Does two things:
 *  1. Writes artisanId to localStorage so every step form can reference it.
 *  2. Fetches the artisan's saved profile from the server and seeds the
 *     localStorage drafts for all steps that have data — so Back navigation
 *     shows pre-filled fields rather than empty forms.
 */
export function ResumeHydrator({ artisanId }: { artisanId: string }) {
  useEffect(() => {
    setOnboardingArtisanId(artisanId);

    fetch(`/api/artisans/onboarding/${artisanId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { profile: Record<string, unknown> } | null) => {
        if (!json?.profile) return;
        const p = json.profile;
        const user = (p.user ?? {}) as Record<string, string>;
        const avail = (p.availability ?? {}) as Record<string, unknown>;
        const portfolio = (p.portfolio ?? []) as Array<Record<string, string | undefined>>;

        // Step 1 — Basic info
        if (p.firstName || user.email) {
          saveDraft(1, {
            firstName: (p.firstName as string) ?? "",
            lastName: (p.lastName as string) ?? "",
            email: user.email ?? "",
            phone: user.phone ?? "",
          });
        }

        // Step 2 — Profession
        if (p.primarySkill || p.bio) {
          saveDraft(2, {
            profilePhotoUrl: (p.profilePhotoUrl as string | null) ?? null,
            primarySkill: (p.primarySkill as string) ?? "",
            secondarySkills: Array.isArray(p.secondarySkills)
              ? (p.secondarySkills as string[]).join(", ")
              : "",
            experienceLevel: p.experienceLevel
              ? (EXP_FROM_DB[p.experienceLevel as string] ?? "")
              : "",
            serviceRadiusKm: String(p.serviceRadiusKm ?? "10"),
            bio: (p.bio as string) ?? "",
          });
        }

        // Step 3 — Location
        if (p.state || p.residentialAddress) {
          saveDraft(3, {
            countryCode: (p.country as string) ?? "NG",
            state: (p.state as string) ?? "",
            lga: (p.lga as string) ?? "",
            residentialAddress: (p.residentialAddress as string) ?? "",
          });
        }

        // Steps 4-6 (ID verification, proof of address, credentials) are file
        // uploads managed by Trust Service. Their file URLs aren't stored on the
        // ArtisanProfile, so they can't be hydrated here — those forms start
        // blank and the user re-uploads if needed.

        // Step 7 — Portfolio
        if (portfolio.length > 0) {
          const SLOT_COUNT = 10;
          const urls: Array<string | null> = Array(SLOT_COUNT).fill(null);
          portfolio.forEach((item, i) => {
            if (i < SLOT_COUNT) urls[i] = item.beforeUrl ?? item.afterUrl ?? null;
          });
          saveDraft(7, { urls });
        }

        // Step 8 — Availability
        if (Array.isArray(avail.workingDays) && avail.workingDays.length > 0) {
          saveDraft(8, {
            workingDays: avail.workingDays as string[],
            startTime: (avail.startTime as string) ?? "09:00",
            endTime: (avail.endTime as string) ?? "17:00",
            emergencyAvailable: (avail.emergencyAvailable as boolean) ?? false,
          });
        }
      })
      .catch(() => {
        // Silently ignore — steps will show empty forms, which is acceptable.
      });
  }, [artisanId]);

  return null;
}
