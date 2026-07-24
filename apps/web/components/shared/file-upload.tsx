"use client";

import { useState } from "react";
import { Check, Upload, Eye } from "lucide-react";

export type UploadType = "profile-photo" | "id-document" | "proof-of-address" | "credential" | "portfolio";

interface SignedUpload {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function FileUpload({
  uploadType,
  label,
  onUploaded,
  accept = "image/*",
  maxSizeMb = MAX_SIZE_MB,
  showPreview = true,
  initialUrl,
}: {
  uploadType: UploadType;
  label: string;
  onUploaded: (url: string) => void;
  accept?: string;
  maxSizeMb?: number;
  showPreview?: boolean;
  initialUrl?: string | null;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    initialUrl ? "done" : "idle",
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialUrl && showPreview ? initialUrl : null,
  );
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialUrl ?? null);
  const [sizeError, setSizeError] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSizeError(false);

    if (file.size > maxSizeMb * 1024 * 1024) {
      setSizeError(true);
      setStatus("error");
      return;
    }

    // Show local preview immediately for images
    if (file.type.startsWith("image/") && showPreview) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    setStatus("uploading");

    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadType }),
      });
      if (!signRes.ok) throw new Error("sign failed");
      const signed: SignedUpload = await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signed.apiKey);
      form.append("timestamp", String(signed.timestamp));
      form.append("signature", signed.signature);
      form.append("folder", signed.folder);

      const resourceType = file.type.startsWith("image/") ? "image" : "auto";
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`,
        { method: "POST", body: form },
      );
      if (!uploadRes.ok) throw new Error("upload failed");
      const uploaded = await uploadRes.json();
      const url = uploaded.secure_url as string;

      setUploadedUrl(url);
      onUploaded(url);
      setStatus("done");
    } catch {
      setPreviewUrl(null);
      setStatus("error");
    }
  }

  // Uploaded image — show thumbnail with re-upload option
  if (status === "done" && previewUrl && showPreview) {
    return (
      <div className="relative overflow-hidden rounded-lg border">
        <img src={previewUrl} alt="Uploaded" className="aspect-square w-full object-cover" />
        <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <input type="file" accept={accept} className="hidden" onChange={handleChange} />
          <Upload className="size-5 text-white" />
          <span className="mt-1 text-xs text-white">Replace</span>
        </label>
        <span className="absolute bottom-1 right-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">
          ✓
        </span>
      </div>
    );
  }

  // Uploaded document (no image preview) — show View button
  if (status === "done" && !previewUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-emerald-50 p-4">
        <Check className="size-5 text-emerald-600" />
        <span className="text-xs text-emerald-700">Uploaded</span>
        {uploadedUrl && (
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
          >
            <Eye className="size-3" /> Preview
          </a>
        )}
        <label className="cursor-pointer text-[10px] text-muted-foreground underline">
          <input type="file" accept={accept} className="hidden" onChange={handleChange} />
          Replace
        </label>
      </div>
    );
  }

  return (
    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-2 text-center text-xs text-muted-foreground hover:border-primary">
      <input type="file" accept={accept} className="hidden" onChange={handleChange} />
      {status === "uploading" ? (
        <Upload className="size-5 animate-pulse" />
      ) : (
        <Upload className="size-5" />
      )}
      <span>
        {status === "uploading"
          ? "Uploading…"
          : status === "error"
            ? sizeError
              ? `Max ${maxSizeMb}MB exceeded`
              : "Failed — tap to retry"
            : label}
      </span>
      {status === "idle" && (
        <span className="text-[10px] text-muted-foreground/60">Images only · max {maxSizeMb}MB</span>
      )}
    </label>
  );
}
