"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Eye,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CredentialStatus = "PENDING" | "APPROVED" | "REJECTED";

type CredentialRecord = {
  id: string;
  type: string;
  fileUrl: string;
  status: CredentialStatus;
  createdAt: string;
};

type UploadType = "id-document" | "proof-of-address" | "credential";

const REQUIRED_CATEGORIES = [
  {
    id: "gov-id",
    label: "Government ID",
    types: ["NIN", "NATIONAL_ID", "DRIVERS_LICENSE", "PASSPORT"],
    hint: "Voter's ID, National ID, Driver's License, or Passport",
    uploadType: "id-document" as UploadType,
    defaultType: "NATIONAL_ID",
  },
  {
    id: "proof-of-address",
    label: "Proof of Address",
    types: ["UTILITY_BILL"],
    hint: "Recent utility bill (within last 3 months)",
    uploadType: "proof-of-address" as UploadType,
    defaultType: "UTILITY_BILL",
  },
  {
    id: "trade-cert",
    label: "Trade Certificate",
    types: ["TRADE_CERTIFICATE", "LICENSE"],
    hint: "Professional trade certification or license",
    uploadType: "credential" as UploadType,
    defaultType: "TRADE_CERTIFICATE",
  },
] as const;

const TYPE_LABELS: Record<string, string> = {
  NIN: "Voter's ID",
  NATIONAL_ID: "National ID",
  DRIVERS_LICENSE: "Driver's License",
  PASSPORT: "Passport",
  UTILITY_BILL: "Utility Bill",
  TRADE_CERTIFICATE: "Trade Certificate",
  LICENSE: "Professional License",
};

interface SignedUpload {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

async function uploadToCloudinary(file: File, uploadType: UploadType): Promise<string> {
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadType }),
  });
  if (!signRes.ok) throw new Error("Failed to get upload signature");
  const signed: SignedUpload = await signRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("signature", signed.signature);
  form.append("folder", signed.folder);

  const resourceType = file.type.startsWith("image/") ? "image" : "auto";
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url as string;
}

function StatusBadge({ status }: { status: CredentialStatus | "NOT_UPLOADED" }) {
  if (status === "APPROVED")
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </Badge>
    );
  if (status === "PENDING")
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700">
        <Clock className="h-3 w-3" /> Under review
      </Badge>
    );
  if (status === "REJECTED")
    return (
      <Badge className="gap-1 bg-red-100 text-red-700">
        <XCircle className="h-3 w-3" /> Rejected
      </Badge>
    );
  return (
    <Badge className="gap-1 bg-muted text-muted-foreground">
      <Upload className="h-3 w-3" /> Not uploaded
    </Badge>
  );
}

function CategoryRow({
  category,
  credential,
  onUploaded,
}: {
  category: (typeof REQUIRED_CATEGORIES)[number];
  credential: CredentialRecord | undefined;
  onUploaded: (type: string, fileUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const status = credential?.status ?? "NOT_UPLOADED";
  const canUpload = status === "NOT_UPLOADED" || status === "REJECTED";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5MB");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadToCloudinary(file, category.uploadType);
      startTransition(async () => {
        const res = await fetch("/api/artisans/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: category.defaultType, fileUrl: url }),
        });
        if (!res.ok) throw new Error("Submit failed");
        onUploaded(category.defaultType, url);
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{category.label}</p>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Required
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{category.hint}</p>
          {credential && (
            <p className="mt-1 text-xs text-muted-foreground">
              {TYPE_LABELS[credential.type] ?? credential.type} ·{" "}
              {new Date(credential.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={status as CredentialStatus | "NOT_UPLOADED"} />
          {credential && (
            <a
              href={credential.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Eye className="h-3 w-3" /> View file
            </a>
          )}
        </div>
      </div>

      {canUpload && (
        <div className="mt-3 border-t pt-3">
          {status === "REJECTED" && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              This document was rejected. Please upload a clearer copy.
            </p>
          )}
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${uploading || pending ? "pointer-events-none opacity-50" : ""}`}>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFile}
              disabled={uploading || pending}
            />
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : pending ? "Submitting…" : status === "REJECTED" ? "Re-upload document" : "Upload document"}
          </label>
          {uploadError && <p className="mt-1 text-xs text-destructive">{uploadError}</p>}
        </div>
      )}
    </div>
  );
}

export function KycSection({ initialCredentials }: { initialCredentials: CredentialRecord[] }) {
  const [credentials, setCredentials] = useState(initialCredentials);

  function getLatestForCategory(types: readonly string[]): CredentialRecord | undefined {
    return credentials
      .filter((c) => types.includes(c.type))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  function handleUploaded(type: string, fileUrl: string) {
    setCredentials((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        type,
        fileUrl,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  const approvedCount = REQUIRED_CATEGORIES.filter((cat) => {
    const latest = getLatestForCategory(cat.types);
    return latest?.status === "APPROVED";
  }).length;

  const total = REQUIRED_CATEGORIES.length;
  const pct = Math.round((approvedCount / total) * 100);

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">KYC Verification</h2>
        </div>
        <span
          className={`text-sm font-semibold ${
            approvedCount === total
              ? "text-emerald-600"
              : approvedCount > 0
              ? "text-amber-600"
              : "text-muted-foreground"
          }`}
        >
          {approvedCount}/{total} approved
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Verification progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-muted"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {approvedCount === total ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> All documents verified
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Upload all required documents to complete verification
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {REQUIRED_CATEGORIES.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            credential={getLatestForCategory(cat.types)}
            onUploaded={handleUploaded}
          />
        ))}
      </div>
    </section>
  );
}
