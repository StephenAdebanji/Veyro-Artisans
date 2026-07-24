"use client";

// next/dynamic with ssr: false is only allowed in Client Components.
// This wrapper owns all step imports and is rendered from the server page.
import dynamic from "next/dynamic";

const Step1BasicInfo = dynamic(
  () => import("./step-1-basic-info").then((m) => ({ default: m.Step1BasicInfo })),
  { ssr: false },
);
const Step2Professional = dynamic(
  () => import("./step-2-professional").then((m) => ({ default: m.Step2Professional })),
  { ssr: false },
);
const Step3Location = dynamic(
  () => import("./step-3-location").then((m) => ({ default: m.Step3Location })),
  { ssr: false },
);
const Step4Verification = dynamic(
  () => import("./step-4-verification").then((m) => ({ default: m.Step4Verification })),
  { ssr: false },
);
const Step5ProofOfAddress = dynamic(
  () => import("./step-5-proof-of-address").then((m) => ({ default: m.Step5ProofOfAddress })),
  { ssr: false },
);
const Step6Credentials = dynamic(
  () => import("./step-6-credentials").then((m) => ({ default: m.Step6Credentials })),
  { ssr: false },
);
const Step7Portfolio = dynamic(
  () => import("./step-7-portfolio").then((m) => ({ default: m.Step7Portfolio })),
  { ssr: false },
);
const Step8Availability = dynamic(
  () => import("./step-8-availability").then((m) => ({ default: m.Step8Availability })),
  { ssr: false },
);

const STEPS = [
  Step1BasicInfo,
  Step2Professional,
  Step3Location,
  Step4Verification,
  Step5ProofOfAddress,
  Step6Credentials,
  Step7Portfolio,
  Step8Availability,
];

export function StepRenderer({ step }: { step: number }) {
  const StepComponent = STEPS[step - 1];
  if (!StepComponent) return null;
  return <StepComponent />;
}
