import { apiFetch } from "@/lib/api-client";

export async function patchOnboardingStep(
  artisanId: string,
  step: number,
  data?: Record<string, unknown>,
  credentials?: Array<{ type: string; fileUrl: string }>,
): Promise<void> {
  try {
    await apiFetch(`/api/artisans/onboarding/${artisanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, data, credentials }),
    });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Could not save this step. Please try again.");
  }
}

export async function submitOnboarding(artisanId: string): Promise<void> {
  try {
    await apiFetch(`/api/artisans/onboarding/${artisanId}/submit`, { method: "POST" });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Could not submit your application. Please try again.");
  }
}
