import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { ResumeHydrator } from "@/components/onboarding/resume-hydrator";

// ssr: false ensures each step component only ever renders on the client.
// This lets their useState lazy-initializers safely read from localStorage
// without hydration mismatches.
const Step1BasicInfo = dynamic(
  () => import("@/components/onboarding/step-1-basic-info").then((m) => ({ default: m.Step1BasicInfo })),
  { ssr: false },
);
const Step2Professional = dynamic(
  () => import("@/components/onboarding/step-2-professional").then((m) => ({ default: m.Step2Professional })),
  { ssr: false },
);
const Step3Location = dynamic(
  () => import("@/components/onboarding/step-3-location").then((m) => ({ default: m.Step3Location })),
  { ssr: false },
);
const Step4Verification = dynamic(
  () => import("@/components/onboarding/step-4-verification").then((m) => ({ default: m.Step4Verification })),
  { ssr: false },
);
const Step5ProofOfAddress = dynamic(
  () => import("@/components/onboarding/step-5-proof-of-address").then((m) => ({ default: m.Step5ProofOfAddress })),
  { ssr: false },
);
const Step6Credentials = dynamic(
  () => import("@/components/onboarding/step-6-credentials").then((m) => ({ default: m.Step6Credentials })),
  { ssr: false },
);
const Step7Portfolio = dynamic(
  () => import("@/components/onboarding/step-7-portfolio").then((m) => ({ default: m.Step7Portfolio })),
  { ssr: false },
);
const Step8Availability = dynamic(
  () => import("@/components/onboarding/step-8-availability").then((m) => ({ default: m.Step8Availability })),
  { ssr: false },
);

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
      {resume && <ResumeHydrator artisanId={resume} />}
      <StepComponent />
    </WizardShell>
  );
}
