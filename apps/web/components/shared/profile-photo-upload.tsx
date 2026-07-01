"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "./avatar";

interface SignedUpload {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

interface ProfilePhotoUploadProps {
  currentUrl: string | null;
  name: string;
  /** PATCH endpoint that accepts { profilePhotoUrl: string } */
  endpoint: string;
  onSaved?: (url: string) => void;
  size?: number;
}

export function ProfilePhotoUpload({
  currentUrl,
  name,
  endpoint,
  onSaved,
  size = 80,
}: ProfilePhotoUploadProps) {
  const [url, setUrl] = useState(currentUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Get signed upload params
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadType: "profile-photo" }),
      });
      if (!signRes.ok) throw new Error("Failed to sign upload");
      const signed: SignedUpload = await signRes.json();

      // 2. Upload to Cloudinary
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signed.apiKey);
      form.append("timestamp", String(signed.timestamp));
      form.append("signature", signed.signature);
      form.append("folder", signed.folder);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      if (!cloudRes.ok) throw new Error("Upload failed");
      const cloudData = await cloudRes.json();
      const newUrl: string = cloudData.secure_url;

      // 3. Persist to DB
      const saveRes = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhotoUrl: newUrl }),
      });
      if (!saveRes.ok) throw new Error("Failed to save photo");

      setUrl(newUrl);
      onSaved?.(newUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar src={url} name={name} size={size} />
        <label
          className={`absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-white shadow transition-opacity hover:opacity-90 ${loading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={loading}
          />
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
