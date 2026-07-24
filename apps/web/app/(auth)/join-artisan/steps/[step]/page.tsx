import { notFound, redirect } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { ResumeHydrator } from "@/components/onboarding/resume-hydrator";
import { StepRenderer } from "@/components/onboarding/step-renderer";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";

const STEP_COUNT = 8;

export default async function JoinArtisanStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ resume?: string }>;
}) {
  const { step } = await params;
  const { resume } = await searchParams;
  const stepNumber = Number(step);

  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > STEP_COUNT) {
    notFound();
  }

  // ── URL-tampering guard ────────────────────────────────────────────────────
  // Users must not be able to skip ahead by editing the URL. We check their
  // actual onboardingStep from the DB and enforce sequential access.
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    // Not authenticated — only step 1 (account creation) is accessible.
    if (stepNumber !== 1) {
      redirect("/join-artisan/steps/1");
    }
  } else {
    const artisanProfile = await userService.getArtisanProfileByUserId(userId);

    if (artisanProfile) {
      // Completed artisans should not be in the onboarding flow.
      if (artisanProfile.onboardingStatus !== "DRAFT") {
        redirect("/artisan/dashboard");
      }

      // onboardingStep = last completed step. Allow up to the next step only.
      const maxAllowedStep = artisanProfile.onboardingStep + 1;
      if (stepNumber > maxAllowedStep) {
        redirect(`/join-artisan/steps/${maxAllowedStep}`);
      }
    } else {
      // Authenticated but no artisan profile — send back to step 1.
      if (stepNumber !== 1) {
        redirect("/join-artisan/steps/1");
      }
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <WizardShell step={stepNumber}>
      {resume && <ResumeHydrator artisanId={resume} />}
      <StepRenderer step={stepNumber} />
    </WizardShell>
  );
}
