"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Eye,
  ShieldCheck,
  AlertTriangle,
  PartyPopper,
  X,
  Loader2,
  FilePlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type CredentialStatus = "PENDING" | "APPROVED" | "REJECTED";
export type VerificationStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";

export type CredentialRecord = {
  id: string;
  type: string;
  fileUrl: string;
  status: CredentialStatus;
  createdAt: string;
};

export type StagedItem = {
  type: string;
  fileUrl: string;
  uploadType: UploadType;
  fileName: string;
};

type UploadType = "id-document" | "proof-of-address" | "credential";

export const REQUIRED_CATEGORIES = [
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

function StatusBadge({
  status,
  verificationStatus,
  staged,
}: {
  status: CredentialStatus | "NOT_UPLOADED";
  verificationStatus: VerificationStatus;
  staged: boolean;
}) {
  if (staged)
    return (
      <Badge className="gap-1 bg-blue-100 text-blue-700">
        <FilePlus className="h-3 w-3" /> Ready to save
      </Badge>
    );

  if (status === "NOT_UPLOADED")
    return (
      <Badge className="gap-1 bg-muted text-muted-foreground">
        <Upload className="h-3 w-3" /> Not uploaded
      </Badge>
    );

  if (verificationStatus === "UNVERIFIED")
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700">
        <Clock className="h-3 w-3" /> Under review
      </Badge>
    );

  if (status === "APPROVED")
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </Badge>
    );
  if (status === "REJECTED")
    return (
      <Badge className="gap-1 bg-red-100 text-red-700">
        <XCircle className="h-3 w-3" /> Rejected
      </Badge>
    );
  return (
    <Badge className="gap-1 bg-amber-100 text-amber-700">
      <Clock className="h-3 w-3" /> Under review
    </Badge>
  );
}

function CategoryRow({
  category,
  credential,
  verificationStatus,
  staged,
  onStaged,
}: {
  category: (typeof REQUIRED_CATEGORIES)[number];
  credential: CredentialRecord | undefined;
  verificationStatus: VerificationStatus;
  staged: StagedItem | null;
  onStaged: (categoryId: string, item: StagedItem) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const rawStatus = credential?.status ?? "NOT_UPLOADED";
  const canUpload =
    rawStatus === "NOT_UPLOADED" ||
    (rawStatus === "REJECTED" && verificationStatus === "REJECTED");
  const showUpload = canUpload && verificationStatus !== "VERIFIED";
  const isStaged = staged !== null;
  const displayFileUrl = staged?.fileUrl ?? credential?.fileUrl;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5MB");
      return;
    }
    e.target.value = "";
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadToCloudinary(file, category.uploadType);
      onStaged(category.id, {
        type: category.defaultType,
        fileUrl: url,
        uploadType: category.uploadType,
        fileName: file.name,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={`rounded-xl border bg-card p-4 ${
        isStaged ? "border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/10" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{category.label}</p>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Required
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{category.hint}</p>
          {isStaged ? (
            <p className="mt-1 text-xs text-blue-600">{staged.fileName} — staged, not yet saved</p>
          ) : credential ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {TYPE_LABELS[credential.type] ?? credential.type} ·{" "}
              {new Date(credential.createdAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge
            status={rawStatus as CredentialStatus | "NOT_UPLOADED"}
            verificationStatus={verificationStatus}
            staged={isStaged}
          />
          {displayFileUrl && (
            <a
              href={displayFileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Eye className="h-3 w-3" /> View file
            </a>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="mt-3 border-t pt-3">
          {rawStatus === "REJECTED" && !isStaged && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              This document was rejected. Please upload a clearer copy.
            </p>
          )}
          {isStaged && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-blue-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              File uploaded.
            </p>
          )}
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${
              uploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {isStaged
                  ? "Choose different file"
                  : rawStatus === "REJECTED"
                  ? "Re-upload document"
                  : "Upload document"}
              </>
            )}
          </label>
          {uploadError && <p className="mt-1 text-xs text-destructive">{uploadError}</p>}
        </div>
      )}
    </div>
  );
}

export function KycSection({
  credentials,
  verificationStatus,
  staged,
  onStaged,
  artisanId,
}: {
  credentials: CredentialRecord[];
  verificationStatus: VerificationStatus;
  staged: Record<string, StagedItem>;
  onStaged: (categoryId: string, item: StagedItem) => void;
  artisanId?: string;
}) {
  const storageKey = artisanId ? `veyro:verified_dismissed:${artisanId}` : null;
  const [verifiedBannerDismissed, setVerifiedBannerDismissed] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return false;
    return !!localStorage.getItem(storageKey);
  });

  function getLatestForCategory(types: readonly string[]): CredentialRecord | undefined {
    return credentials
      .filter((c) => types.includes(c.type))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  const submittedCount = REQUIRED_CATEGORIES.filter(
    (cat) => getLatestForCategory(cat.types) || staged[cat.id],
  ).length;
  const total = REQUIRED_CATEGORIES.length;
  const pct = Math.round((submittedCount / total) * 100);
  const hasStaged = Object.keys(staged).length > 0;

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">KYC Verification</h2>
        </div>
        {verificationStatus === "VERIFIED" ? (
          <Badge className="gap-1 bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
          </Badge>
        ) : verificationStatus === "REJECTED" ? (
          <Badge className="gap-1 bg-red-100 text-red-700">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </Badge>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">
            {submittedCount}/{total} submitted
          </span>
        )}
      </div>

      {verificationStatus === "VERIFIED" && !verifiedBannerDismissed && (() => {
        // Mark as seen when this renders so next login won't show it.
        if (storageKey && typeof window !== "undefined" && !localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, "1");
        }
        return (
          <div className="relative mb-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 pr-10 dark:border-emerald-900 dark:bg-emerald-950/30">
            <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Your application has been accepted!
              </p>
              <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-400">
                You are now fully verified. Go to the{" "}
                <a href="/artisan/jobs" className="underline underline-offset-2">
                  Jobs
                </a>{" "}
                page to start viewing and accepting job requests.
              </p>
            </div>
            <button
              onClick={() => setVerifiedBannerDismissed(true)}
              aria-label="Dismiss"
              className="absolute right-3 top-3 rounded p-0.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })()}

      {verificationStatus === "REJECTED" && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              Your application was rejected
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              One or more of your documents could not be verified. Please re-upload clearer copies
              below, then click <strong>Save</strong> to re-submit for review.
            </p>
          </div>
        </div>
      )}

      {verificationStatus === "UNVERIFIED" && (
        <div className="mb-5">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Documents submitted</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct === 100 ? "bg-primary" : pct > 0 ? "bg-amber-500" : "bg-muted"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {hasStaged
              ? "Files staged. Click Save to submit them for review."
              : submittedCount === total
              ? "All documents submitted — our team will review and get back to you shortly."
              : "Upload all required documents to complete your submission."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {REQUIRED_CATEGORIES.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            credential={getLatestForCategory(cat.types)}
            verificationStatus={verificationStatus}
            staged={staged[cat.id] ?? null}
            onStaged={onStaged}
          />
        ))}
      </div>
    </section>
  );
}
