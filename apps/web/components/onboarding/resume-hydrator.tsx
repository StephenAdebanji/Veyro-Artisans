"use client";

import { useEffect } from "react";
import { setOnboardingArtisanId } from "./onboarding-storage";

/**
 * Silently writes the artisanId into localStorage so every subsequent step
 * form can read it via getOnboardingArtisanId().  Runs on mount only —
 * renders nothing visible.
 */
export function ResumeHydrator({ artisanId }: { artisanId: string }) {
  useEffect(() => {
    setOnboardingArtisanId(artisanId);
  }, [artisanId]);
  return null;
}
