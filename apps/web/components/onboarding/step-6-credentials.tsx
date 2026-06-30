"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/file-upload";
import { StepFooter } from "./step-footer";
import { getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep } from "./onboarding-api";

export function Step6Credentials() {
  const router = useRouter();
  const [tradeCertUrl, setTradeCertUrl] = useState<string | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [otherUrl, setOtherUrl] = useState<string | null>(null);
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
      tradeCertUrl ? { type: "TRADE_CERTIFICATE", fileUrl: tradeCertUrl } : null,
      licenseUrl ? { type: "LICENSE", fileUrl: licenseUrl } : null,
      otherUrl ? { type: "OTHER", fileUrl: otherUrl } : null,
    ].filter((credential): credential is { type: string; fileUrl: string } => credential !== null);

    setError(null);
    setLoading(true);
    try {
      // Uploads are optional at this step (no asterisk in the design) — an
      // incomplete profile just won't clear verification until added later.
      await patchOnboardingStep(artisanId, 6, undefined, credentials.length > 0 ? credentials : undefined);
      router.push("/join-artisan/steps/7");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>Trade certificate</Label>
        <FileUpload uploadType="credential" label="Click to upload" onUploaded={setTradeCertUrl} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>License (optional)</Label>
        <FileUpload uploadType="credential" label="Click to upload" onUploaded={setLicenseUrl} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label>Other credentials</Label>
        <div className="max-w-48">
          <FileUpload uploadType="credential" label="Click to upload" onUploaded={setOtherUrl} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <StepFooter step={6} loading={loading} />
      </div>
    </form>
  );
}
