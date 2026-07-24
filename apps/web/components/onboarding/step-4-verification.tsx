"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { StepFooter } from "./step-footer";
import { getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep } from "./onboarding-api";
import { loadDraft, saveDraft } from "./onboarding-draft";

const ID_TYPES = ["NIN", "NATIONAL_ID", "DRIVERS_LICENSE", "PASSPORT"] as const;
const ID_TYPE_LABELS: Record<(typeof ID_TYPES)[number], string> = {
  NIN: "Voters ID",
  NATIONAL_ID: "National ID",
  DRIVERS_LICENSE: "Driver's License",
  PASSPORT: "Passport",
};

type Step4Draft = {
  idType: (typeof ID_TYPES)[number];
  idNumber: string;
  fileUrl: string | null;
};

export function Step4Verification() {
  const router = useRouter();
  const [idType, setIdType] = useState<(typeof ID_TYPES)[number]>("NIN");
  const [idNumber, setIdNumber] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Stable initial URL for FileUpload — set once from draft.
  const [initialFileUrl, setInitialFileUrl] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadDraft<Step4Draft>(4);
    if (!draft) return;
    if (draft.idType) setIdType(draft.idType);
    if (draft.idNumber) setIdNumber(draft.idNumber);
    if (draft.fileUrl) { setFileUrl(draft.fileUrl); setInitialFileUrl(draft.fileUrl); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveDraft<Step4Draft>(4, { idType, idNumber, fileUrl });
  }, [idType, idNumber, fileUrl]);

  function handleIdNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "");
    setIdNumber(value);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const artisanId = getOnboardingArtisanId();
    if (!artisanId) {
      setError("Your session expired — please start again from step 1.");
      return;
    }
    if (!fileUrl) {
      setError("Please upload your ID document before continuing.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await patchOnboardingStep(artisanId, 4, undefined, [{ type: idType, fileUrl }]);
      router.push("/join-artisan/steps/5");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>ID type <span className="text-destructive">*</span></Label>
        <Select value={idType} onValueChange={(value) => setIdType(value as (typeof ID_TYPES)[number])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ID_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {ID_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="idNumber">ID number <span className="text-destructive">*</span></Label>
        <Input
          id="idNumber"
          inputMode="numeric"
          pattern="[0-9]*"
          value={idNumber}
          onChange={handleIdNumberChange}
          placeholder="Numbers only"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label>
          Upload ID document <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">Upload a clear photo or scan of your ID (images only)</p>
        <div className="max-w-48">
          <FileUpload
            key={`id-doc-${initialFileUrl ?? "empty"}`}
            uploadType="id-document"
            label="Click to upload"
            accept="image/*"
            showPreview={false}
            initialUrl={initialFileUrl}
            onUploaded={(url) => setFileUrl(url)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <StepFooter step={4} loading={loading} />
      </div>
    </form>
  );
}
