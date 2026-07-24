"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/file-upload";
import { StepFooter } from "./step-footer";
import { getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep } from "./onboarding-api";
import { loadDraft, saveDraft } from "./onboarding-draft";

type Step6Draft = {
  tradeCertUrl: string | null;
  licenseUrl: string | null;
  otherUrl: string | null;
};

export function Step6Credentials() {
  const router = useRouter();
  const [tradeCertUrl, setTradeCertUrl] = useState<string | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [otherUrl, setOtherUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Stable initial URLs for FileUpload slots — set once from draft.
  const [initialTradeCertUrl, setInitialTradeCertUrl] = useState<string | null>(null);
  const [initialLicenseUrl, setInitialLicenseUrl] = useState<string | null>(null);
  const [initialOtherUrl, setInitialOtherUrl] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadDraft<Step6Draft>(6);
    if (!draft) return;
    if (draft.tradeCertUrl) { setTradeCertUrl(draft.tradeCertUrl); setInitialTradeCertUrl(draft.tradeCertUrl); }
    if (draft.licenseUrl) { setLicenseUrl(draft.licenseUrl); setInitialLicenseUrl(draft.licenseUrl); }
    if (draft.otherUrl) { setOtherUrl(draft.otherUrl); setInitialOtherUrl(draft.otherUrl); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveDraft<Step6Draft>(6, { tradeCertUrl, licenseUrl, otherUrl });
  }, [tradeCertUrl, licenseUrl, otherUrl]);

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
        <FileUpload
          key={`trade-${initialTradeCertUrl ?? "empty"}`}
          uploadType="credential"
          label="Click to upload"
          initialUrl={initialTradeCertUrl}
          onUploaded={(url) => setTradeCertUrl(url)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>License (optional)</Label>
        <FileUpload
          key={`license-${initialLicenseUrl ?? "empty"}`}
          uploadType="credential"
          label="Click to upload"
          initialUrl={initialLicenseUrl}
          onUploaded={(url) => setLicenseUrl(url)}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label>Other credentials</Label>
        <div className="max-w-48">
          <FileUpload
            key={`other-${initialOtherUrl ?? "empty"}`}
            uploadType="credential"
            label="Click to upload"
            initialUrl={initialOtherUrl}
            onUploaded={(url) => setOtherUrl(url)}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <StepFooter step={6} loading={loading} />
      </div>
    </form>
  );
}
