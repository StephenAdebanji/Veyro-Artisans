"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { clearAllDrafts } from "./onboarding-draft";
import { clearOnboardingArtisanId } from "./onboarding-storage";

/**
 * Always produces a completely fresh onboarding state:
 * 1. Clears all localStorage drafts and artisanId.
 * 2. Signs the user out if they have an active session, so they arrive at
 *    step 1 as an unauthenticated visitor with a blank form.
 *
 * "Resume from where you left off" is only possible via the sign-in page,
 * never via the Join as artisan button.
 */
export function JoinArtisanEntryClient() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    clearAllDrafts();
    clearOnboardingArtisanId();

    if (status === "authenticated") {
      signOut({ redirect: false }).then(() => {
        router.replace("/join-artisan/steps/1");
      });
    } else {
      router.replace("/join-artisan/steps/1");
    }
  }, [status, router]);

  return null;
}
