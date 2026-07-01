"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CredentialItem = {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  createdAt: string;
};

type VerificationStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
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

  async function decide(decision: "APPROVED" | "REJECTED") {
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
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{cred.type.replace(/_/g, " ")}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(cred.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className={STATUS_STYLE[cred.status] ?? "bg-muted text-muted-foreground"}>
          {cred.status}
        </Badge>
        <a
          href={cred.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary hover:underline whitespace-nowrap"
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

export function CredentialsReviewer({
  initialCredentials,
  verificationStatus,
}: {
  initialCredentials: CredentialItem[];
  verificationStatus: VerificationStatus;
}) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [currentVerificationStatus, setCurrentVerificationStatus] =
    useState<VerificationStatus>(verificationStatus);

  const locked = currentVerificationStatus === "VERIFIED" || currentVerificationStatus === "REJECTED";
  const approvedCount = credentials.filter((c) => c.status === "APPROVED").length;
  const total = credentials.length;

  function handleReviewed(id: string, decision: "APPROVED" | "REJECTED") {
    setCredentials((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: decision } : c)),
    );
  }

  // Called by VerificationDecision via a shared unlock signal
  function unlock() {
    setCurrentVerificationStatus("UNVERIFIED");
    setCredentials((prev) => prev.map((c) => ({ ...c, status: "PENDING" })));
  }

  if (total === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border bg-card p-5" data-credentials-reviewer>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Credentials
        </h2>
        {locked ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Locked after final decision
          </span>
        ) : (
          <span className={`text-sm font-semibold ${approvedCount === total ? "text-emerald-600" : "text-amber-600"}`}>
            {approvedCount}/{total} approved
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {credentials.map((cred) => (
          <CredentialRow key={cred.id} cred={cred} locked={locked} onReviewed={handleReviewed} />
        ))}
      </ul>
    </div>
  );
}
