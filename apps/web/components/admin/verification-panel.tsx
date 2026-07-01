"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CredentialItem = {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  createdAt: string;
};

type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

const CREDENTIAL_STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
};

const DECISION_LABEL: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: "Approved", className: "text-emerald-600" },
  REJECTED: { label: "Rejected", className: "text-red-600" },
};

function CredentialRow({
  cred,
  locked,
  onReviewed,
}: {
  cred: CredentialItem;
  locked: boolean;
  onReviewed: (id: string, decision: "APPROVED" | "REJECTED") => void;
}) {
  const [pending, startTransition] = useTransition();

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const res = await fetch(`/api/admin/credentials/${cred.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) onReviewed(cred.id, decision);
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{cred.type.replace(/_/g, " ")}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(cred.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge className={CREDENTIAL_STATUS_STYLE[cred.status] ?? "bg-muted text-muted-foreground"}>
          {cred.status}
        </Badge>
        <a
          href={cred.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap text-xs text-primary hover:underline"
        >
          View file
        </a>
        {locked ? (
          <span
            title="Final decision taken — revoke to re-enable"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground"
          >
            <Lock className="h-3.5 w-3.5" />
            Locked
          </span>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending || cred.status === "APPROVED"}
              className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              title="Approve"
              onClick={() => decide("APPROVED")}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending || cred.status === "REJECTED"}
              className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
              title="Reject"
              onClick={() => decide("REJECTED")}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export function VerificationPanel({
  artisanId,
  initialVerificationStatus,
  initialCredentials,
}: {
  artisanId: string;
  initialVerificationStatus: VerificationStatus;
  initialCredentials: CredentialItem[];
}) {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    initialVerificationStatus,
  );
  const [credentials, setCredentials] = useState<CredentialItem[]>(initialCredentials);
  const [pending, startTransition] = useTransition();

  const decided = verificationStatus === "VERIFIED" || verificationStatus === "REJECTED";
  const approvedCount = credentials.filter((c) => c.status === "APPROVED").length;
  const total = credentials.length;

  function handleCredentialReviewed(id: string, decision: "APPROVED" | "REJECTED") {
    setCredentials((prev) => prev.map((c) => (c.id === id ? { ...c, status: decision } : c)));
  }

  function submitDecision(decision: "APPROVED" | "REJECTED" | "REVOKED") {
    startTransition(async () => {
      const res = await fetch(`/api/admin/artisans/${artisanId}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) return;

      if (decision === "APPROVED") {
        setVerificationStatus("VERIFIED");
      } else if (decision === "REJECTED") {
        setVerificationStatus("REJECTED");
      } else {
        // REVOKED — reset everything locally
        setVerificationStatus("UNVERIFIED");
        setCredentials((prev) => prev.map((c) => ({ ...c, status: "PENDING" })));
      }

      router.refresh();
    });
  }

  return (
    <>
      {/* Credentials */}
      {total > 0 && (
        <div className="mt-5 rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Credentials
            </h2>
            {decided ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Locked after final decision
              </span>
            ) : (
              <span
                className={`text-sm font-semibold ${
                  approvedCount === total ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {approvedCount}/{total} approved
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {credentials.map((cred) => (
              <CredentialRow
                key={cred.id}
                cred={cred}
                locked={decided}
                onReviewed={handleCredentialReviewed}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Final Decision */}
      <div className="mt-5 rounded-2xl border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Final Decision
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Review the credentials above then make your final call on this artisan application.
        </p>

        {decided ? (
          <div className="flex items-center justify-between gap-4">
            <div
              className={`flex items-center gap-2 text-sm font-semibold ${DECISION_LABEL[verificationStatus]?.className ?? ""}`}
            >
              {verificationStatus === "VERIFIED" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Decision recorded: {DECISION_LABEL[verificationStatus]?.label}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              className="gap-2 border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
              onClick={() => submitDecision("REVOKED")}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Revoke Decision
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={pending}
              onClick={() => submitDecision("APPROVED")}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve Artisan
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50"
              disabled={pending}
              onClick={() => submitDecision("REJECTED")}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Reject Artisan
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
