const KEY = "veyro_onboarding_artisan_id";

// Each onboarding step lives on its own route (/join-artisan/steps/N), so the
// in-progress artisanId (returned by step 1) needs to survive navigation
// without a server session to key off yet — localStorage is the simplest
// thing that works for a single-device signup flow.
export function getOnboardingArtisanId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setOnboardingArtisanId(id: string): void {
  localStorage.setItem(KEY, id);
}

export function clearOnboardingArtisanId(): void {
  localStorage.removeItem(KEY);
}
