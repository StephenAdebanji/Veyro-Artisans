"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/file-upload";
import { StepFooter } from "./step-footer";
import { getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep } from "./onboarding-api";

export function Step5ProofOfAddress() {
  const router = useRouter();
  const [utilityBillUrl, setUtilityBillUrl] = useState<string | null>(null);
  const [bankStatementUrl, setBankStatementUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const artisanId = getOnboardingArtisanId();
    if (!artisanId) {
      setError("Your session expired — please start again from step 1.");
      return;
    }

    const credentials = [
      utilityBillUrl ? { type: "UTILITY_BILL", fileUrl: utilityBillUrl } : null,
      bankStatementUrl ? { type: "BANK_STATEMENT", fileUrl: bankStatementUrl } : null,
    ].filter((credential): credential is { type: string; fileUrl: string } => credential !== null);

    setError(null);
    setLoading(true);
    try {
      // Uploads are optional at this step (no asterisk in the design) — an
      // incomplete profile just won't clear verification until added later.
      await patchOnboardingStep(artisanId, 5, undefined, credentials.length > 0 ? credentials : undefined);
      router.push("/join-artisan/steps/6");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>Utility bill</Label>
        <FileUpload uploadType="proof-of-address" label="Click to upload" onUploaded={setUtilityBillUrl} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Bank statement</Label>
        <FileUpload uploadType="proof-of-address" label="Click to upload" onUploaded={setBankStatementUrl} />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <StepFooter step={5} loading={loading} />
      </div>
    </form>
  );
}
