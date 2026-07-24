import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";
import { JoinArtisanEntryClient } from "@/components/onboarding/join-artisan-entry-client";

/**
 * Entry point for every "Join as artisan" button in the app.
 *
 * Routing logic (executed server-side so there's no client-side flash):
 *
 *  - Authenticated + DRAFT artisan profile
 *      → Clear form-field drafts (fresh state per user intent) but keep
 *        artisanId in localStorage so step 1's read-only guard still works.
 *        Redirect straight to their current step (same as the sign-in flow).
 *
 *  - Authenticated + completed artisan profile
 *      → Redirect to dashboard.
 *
 *  - Unauthenticated / no artisan profile
 *      → Clear ALL localStorage (drafts + artisanId) and redirect to step 1.
 *        This guarantees a new visitor — or someone returning after a
 *        drop-off whose session has expired — always sees a blank form.
 */
export default async function JoinArtisanPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (userId) {
    const artisanProfile = await userService.getArtisanProfileByUserId(userId);

    if (artisanProfile) {
      if (artisanProfile.onboardingStatus !== "DRAFT") {
        redirect("/artisan/dashboard");
      }

      // DRAFT: clear form drafts for a "fresh" feel but keep artisanId so
      // the step-1 alreadyRegistered check still works on back navigation.
      const resumeStep = Math.min(artisanProfile.onboardingStep + 1, 8);
      return (
        <JoinArtisanEntryClient
          clearArtisanId={false}
          redirectTo={`/join-artisan/steps/${resumeStep}?resume=${artisanProfile.id}`}
        />
      );
    }
  }

  // Unauthenticated or no artisan profile — full reset, then blank step 1.
  return <JoinArtisanEntryClient clearArtisanId={true} redirectTo="/join-artisan/steps/1" />;
}
