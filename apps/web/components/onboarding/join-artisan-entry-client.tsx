"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAllDrafts } from "./onboarding-draft";
import { clearOnboardingArtisanId } from "./onboarding-storage";

interface Props {
  /** When true, also wipes the stored artisanId (fresh guest sign-up). */
  clearArtisanId: boolean;
  /** Where to navigate after clearing. */
  redirectTo: string;
}

/**
 * Client-side gate for the /join-artisan entry point.
 *
 * Always clears all form field drafts (fresh state). Whether the artisanId
 * is cleared too depends on the caller: unauthenticated guests need a full
 * reset; authenticated DRAFT artisans only need their drafts wiped (the
 * artisanId is still needed so step 1 shows the read-only "already set up"
 * banner if they navigate back to it).
 */
export function JoinArtisanEntryClient({ clearArtisanId, redirectTo }: Props) {
  const router = useRouter();

  useEffect(() => {
    clearAllDrafts();
    if (clearArtisanId) clearOnboardingArtisanId();
    router.replace(redirectTo);
  }, [clearArtisanId, redirectTo, router]);

  return null;
}
