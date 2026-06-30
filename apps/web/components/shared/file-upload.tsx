"use client";

import { useState } from "react";
import { Check, Upload } from "lucide-react";

export type UploadType = "profile-photo" | "id-document" | "proof-of-address" | "credential" | "portfolio";

interface SignedUpload {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function FileUpload({
  uploadType,
  label,
  onUploaded,
  accept = "image/*,.pdf",
}: {
  uploadType: UploadType;
  label: string;
  onUploaded: (url: string) => void;
  accept?: string;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

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

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`, {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) throw new Error("upload failed");
      const uploaded = await uploadRes.json();

      onUploaded(uploaded.secure_url as string);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-2 text-center text-xs text-muted-foreground hover:border-primary">
      <input type="file" accept={accept} className="hidden" onChange={handleChange} />
      {status === "done" ? (
        <Check className="size-5 text-emerald-600" />
      ) : (
        <Upload className="size-5" />
      )}
      <span>
        {status === "uploading"
          ? "Uploading…"
          : status === "done"
            ? "Uploaded"
            : status === "error"
              ? "Failed — tap to retry"
              : label}
      </span>
    </label>
  );
}
