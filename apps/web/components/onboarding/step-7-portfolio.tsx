"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/shared/file-upload";
import { StepFooter } from "./step-footer";
import { getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep } from "./onboarding-api";
import { loadDraft, saveDraft } from "./onboarding-draft";

type Step7Draft = {
  urls: Array<string | null>;
};

const SLOT_COUNT = 10;
const EMPTY_SLOTS: Array<string | null> = Array(SLOT_COUNT).fill(null);

export function Step7Portfolio() {
  const router = useRouter();
  // init.urls provides stable initial URLs per slot — used as FileUpload keys
  // so each slot only remounts once (on first mount with draft values).
  const init = useMemo(() => {
    const d = loadDraft<Step7Draft>(7);
    if (!d?.urls) return { urls: EMPTY_SLOTS };
    const loaded = d.urls.slice(0, SLOT_COUNT);
    while (loaded.length < SLOT_COUNT) loaded.push(null);
    return { urls: loaded };
  }, []);

  const [urls, setUrls] = useState<Array<string | null>>(init.urls);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveDraft<Step7Draft>(7, { urls });
  }, [urls]);

  function setSlot(index: number, url: string) {
    setUrls((current) => current.map((value, i) => (i === index ? url : value)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const artisanId = getOnboardingArtisanId();
    if (!artisanId) {
      setError("Your session expired — please start again from step 1.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const items = urls.filter((url): url is string => url !== null).map((url) => ({ afterUrl: url }));
      await patchOnboardingStep(artisanId, 7, { items });
      router.push("/join-artisan/steps/8");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const uploadedCount = urls.filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-semibold">Upload photos of previous work done (before and after)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add up to {SLOT_COUNT} images showcasing your work. Images only · max 5MB each.
      </p>
      {uploadedCount > 0 && (
        <p className="mt-1 text-sm font-medium text-primary">
          {uploadedCount} photo{uploadedCount !== 1 ? "s" : ""} uploaded
        </p>
      )}
      <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
        {init.urls.map((initialUrl, index) => (
          <FileUpload
            key={`slot-${index}-${initialUrl ?? "empty"}`}
            uploadType="portfolio"
            label={`Photo ${index + 1}`}
            accept="image/*"
            maxSizeMb={5}
            showPreview={true}
            initialUrl={initialUrl}
            onUploaded={(url) => setSlot(index, url)}
          />
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <StepFooter step={7} loading={loading} />
    </form>
  );
}
