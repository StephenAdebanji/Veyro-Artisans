export async function patchOnboardingStep(
  artisanId: string,
  step: number,
  data?: Record<string, unknown>,
  credentials?: Array<{ type: string; fileUrl: string }>,
): Promise<void> {
  const response = await fetch(`/api/artisans/onboarding/${artisanId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, data, credentials }),
  });
  if (!response.ok) {
    throw new Error("Could not save this step. Please try again.");
  }
}

export async function submitOnboarding(artisanId: string): Promise<void> {
  const response = await fetch(`/api/artisans/onboarding/${artisanId}/submit`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Could not submit your application. Please try again.");
  }
}
