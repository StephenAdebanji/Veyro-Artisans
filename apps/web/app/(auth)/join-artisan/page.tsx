import { JoinArtisanEntryClient } from "@/components/onboarding/join-artisan-entry-client";

/**
 * Entry point for every "Join as artisan" button.
 * Always produces a fresh blank registration — no auth checks, no resume logic.
 * Resume is only possible by signing in via /sign-in.
 */
export default function JoinArtisanPage() {
  return <JoinArtisanEntryClient />;
}
