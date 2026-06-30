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
    if (!utilityBillUrl) {
      setError("Please upload your utility bill before continuing.");
      return;
    }
    if (!bankStatementUrl) {
      setError("Please upload your bank statement before continuing.");
      return;
    }

    const credentials = [
      { type: "UTILITY_BILL", fileUrl: utilityBillUrl },
      { type: "BANK_STATEMENT", fileUrl: bankStatementUrl },
    ];

    setError(null);
    setLoading(true);
    try {
      await patchOnboardingStep(artisanId, 5, undefined, credentials);
      router.push("/join-artisan/steps/6");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>
          Utility bill <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">Electricity, water or gas bill (images only)</p>
        <FileUpload
          uploadType="proof-of-address"
          label="Click to upload"
          accept="image/*"
          showPreview={false}
          onUploaded={setUtilityBillUrl}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>
          Bank statement <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">Last 3 months statement (images only)</p>
        <FileUpload
          uploadType="proof-of-address"
          label="Click to upload"
          accept="image/*"
          showPreview={false}
          onUploaded={setBankStatementUrl}
        />
      </div>

      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <StepFooter step={5} loading={loading} />
      </div>
    </form>
  );
}
