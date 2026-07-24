import { notFound } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { ResumeHydrator } from "@/components/onboarding/resume-hydrator";
import { StepRenderer } from "@/components/onboarding/step-renderer";

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

  return (
    <WizardShell step={stepNumber}>
      {resume && <ResumeHydrator artisanId={resume} />}
      <StepRenderer step={stepNumber} />
    </WizardShell>
  );
}
