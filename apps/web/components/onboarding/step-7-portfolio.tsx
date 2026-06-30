"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/shared/file-upload";
import { StepFooter } from "./step-footer";
import { getOnboardingArtisanId } from "./onboarding-storage";
import { patchOnboardingStep } from "./onboarding-api";

const SLOT_COUNT = 10;

export function Step7Portfolio() {
  const router = useRouter();
  const [urls, setUrls] = useState<Array<string | null>>(Array(SLOT_COUNT).fill(null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        <p className="mt-1 text-sm font-medium text-primary">{uploadedCount} photo{uploadedCount !== 1 ? "s" : ""} uploaded</p>
      )}
      <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
        {urls.map((_, index) => (
          <FileUpload
            key={index}
            uploadType="portfolio"
            label={`Photo ${index + 1}`}
            accept="image/*"
            maxSizeMb={5}
            showPreview={true}
            onUploaded={(url) => setSlot(index, url)}
          />
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <StepFooter step={7} loading={loading} />
    </form>
  );
}
