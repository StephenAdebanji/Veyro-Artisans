import { notFound } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { ResumeHydrator } from "@/components/onboarding/resume-hydrator";
import { Step1BasicInfo } from "@/components/onboarding/step-1-basic-info";
import { Step2Professional } from "@/components/onboarding/step-2-professional";
import { Step3Location } from "@/components/onboarding/step-3-location";
import { Step4Verification } from "@/components/onboarding/step-4-verification";
import { Step5ProofOfAddress } from "@/components/onboarding/step-5-proof-of-address";
import { Step6Credentials } from "@/components/onboarding/step-6-credentials";
import { Step7Portfolio } from "@/components/onboarding/step-7-portfolio";
import { Step8Availability } from "@/components/onboarding/step-8-availability";

const STEP_COMPONENTS = [
  Step1BasicInfo,
  Step2Professional,
  Step3Location,
  Step4Verification,
  Step5ProofOfAddress,
  Step6Credentials,
  Step7Portfolio,
  Step8Availability,
];

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
  const StepComponent = STEP_COMPONENTS[stepNumber - 1];

  if (!Number.isInteger(stepNumber) || !StepComponent) {
    notFound();
  }

  return (
    <WizardShell step={stepNumber}>
      {/* When an artisan resumes mid-onboarding (redirected by the artisan
          layout), the ?resume=<artisanId> param re-hydrates localStorage so
          each step form can pick up where they left off on any device. */}
      {resume && <ResumeHydrator artisanId={resume} />}
      <StepComponent />
    </WizardShell>
  );
}
