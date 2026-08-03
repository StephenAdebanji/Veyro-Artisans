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
  Trash2,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiFetch } from "@/lib/api-client";

type CredentialItem = {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  createdAt: string;
};

type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

const GOVT_ID_TYPES = ["NIN", "NATIONAL_ID", "DRIVERS_LICENSE", "PASSPORT"];

const CREDENTIAL_STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING:  "bg-amber-100 text-amber-700",
};

const DECISION_LABEL: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: "Approved",  className: "text-emerald-600" },
  REJECTED: { label: "Rejected",  className: "text-red-600" },
};

// ── Per-credential row ────────────────────────────────────────────────────────

function CredentialRow({
  cred,
  locked,
  onReviewed,
  onDeleted,
}: {
  cred: CredentialItem;
  locked: boolean;
  onReviewed: (id: string, decision: "APPROVED" | "REJECTED") => void;
  onDeleted: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "APPROVED" | "REJECTED") {
    setError(null);
    startTransition(async () => {
      try {
        await apiFetch(`/api/admin/credentials/${cred.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        });
        onReviewed(cred.id, decision);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await apiFetch(`/api/admin/credentials/${cred.id}`, { method: "DELETE" });
        setConfirmDelete(false);
        onDeleted(cred.id);
      } catch (err) {
        setConfirmDelete(false);
        setError(err instanceof Error ? err.message : "Could not delete. Please try again.");
      }
    });
  }

  return (
    <>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete credential"
        description={`Delete this ${cred.type.replace(/_/g, " ")} document? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <li className="rounded-lg border p-3">
        <div className="flex items-center justify-between gap-4">
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
            className="flex items-center gap-1 whitespace-nowrap text-xs text-primary hover:underline"
          >
            <Eye className="h-3 w-3" /> View
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
            title="Delete credential"
            disabled={pending}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
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
        </div>
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      </li>
    </>
  );
}

// ── Approve confirm dialog ────────────────────────────────────────────────────

function ApproveConfirmDialog({
  credentials,
  open,
  loading,
  onConfirm,
  onCancel,
}: {
  credentials: CredentialItem[];
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const credLabels = credentials.map((c) => c.type.replace(/_/g, " ")).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <h2 className="text-base font-semibold">Approve artisan application</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This will approve <strong>all uploaded documents</strong> and grant the artisan
              full access to receive job requests.
            </p>
          </div>
        </div>

        {credentials.length > 0 && (
          <div className="mb-4 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Documents being approved:</p>
            <p className="mt-1">{credLabels}</p>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Confirm Approval
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Rejection reason dialog ───────────────────────────────────────────────────

function RejectReasonDialog({
  credentials,
  open,
  loading,
  onConfirm,
  onCancel,
}: {
  credentials: CredentialItem[];
  open: boolean;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  if (!open) return null;

  const credLabels = credentials.map((c) => c.type.replace(/_/g, " ")).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <h2 className="text-base font-semibold">Reject artisan application</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This will reject <strong>all uploaded documents</strong> and notify the artisan.
              You must provide a reason before proceeding.
            </p>
          </div>
        </div>

        {credentials.length > 0 && (
          <div className="mb-4 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Documents being rejected:</p>
            <p className="mt-1">{credLabels}</p>
          </div>
        )}

        <label className="mb-1.5 block text-sm font-medium" htmlFor="rejection-reason">
          Rejection reason <span className="text-red-500">*</span>
        </label>
        <p className="mb-2 text-xs text-muted-foreground">
          Specify which file category is challenged. The artisan will see this message on their dashboard.
        </p>
        <textarea
          id="rejection-reason"
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={`e.g. Your Government ID could not be approved — please re-upload a clear, valid, and unexpired document.`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          A standard reminder will be appended automatically:{" "}
          <em>&ldquo;Please review the file and make sure it is correct, clear, and not outdated.&rdquo;</em>
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-red-600 text-white hover:bg-red-700"
            disabled={!trimmed || loading}
            onClick={() => onConfirm(trimmed)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function VerificationPanel({
  artisanId,
  initialVerificationStatus,
  initialCredentials,
  onboardingStatus,
}: {
  artisanId: string;
  initialVerificationStatus: VerificationStatus;
  initialCredentials: CredentialItem[];
  onboardingStatus: string;
}) {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    initialVerificationStatus,
  );
  const [credentials, setCredentials] = useState<CredentialItem[]>(initialCredentials);
  const [pending, startTransition] = useTransition();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const decided = verificationStatus === "VERIFIED" || verificationStatus === "REJECTED";
  const approvedCount = credentials.filter((c) => c.status === "APPROVED").length;
  const total = credentials.length;
  const pendingCredentials = credentials.filter((c) => c.status === "PENDING");

  // Steps 4 (Government ID) and 5 (Utility bill / proof of address) are the
  // only two required uploads in the onboarding wizard — every other step,
  // including trade credentials, is optional. In principle an artisan who
  // reached PENDING_REVIEW (clicked Submit) should always have both, but the
  // wizard's submit step doesn't actually enforce that server-side, so in
  // practice plenty of real profiles reach PENDING_REVIEW — even step 8 —
  // with zero documents. Key the warning off whether a final decision has
  // been made rather than onboardingStatus, so it still surfaces for those.
  const missingGovtId = !credentials.some((c) => GOVT_ID_TYPES.includes(c.type));
  const missingProofOfAddress = !credentials.some((c) => c.type === "UTILITY_BILL");
  const missingCompulsoryDocs = !decided && (missingGovtId || missingProofOfAddress);
  const missingLabels = [
    missingGovtId ? "Government ID" : null,
    missingProofOfAddress ? "Proof of address (utility bill)" : null,
  ].filter((label): label is string => label !== null);

  function handleCredentialReviewed(id: string, decision: "APPROVED" | "REJECTED") {
    setCredentials((prev) => prev.map((c) => (c.id === id ? { ...c, status: decision } : c)));
  }

  function handleCredentialDeleted(id: string) {
    setCredentials((prev) => prev.filter((c) => c.id !== id));
  }

  function submitDecision(decision: "APPROVED" | "REJECTED" | "REVOKED", reason?: string) {
    setDecisionError(null);
    startTransition(async () => {
      try {
        await apiFetch(`/api/admin/artisans/${artisanId}/verification`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, reason }),
        });
      } catch (err) {
        setDecisionError(err instanceof Error ? err.message : "Could not save. Please try again.");
        return;
      }

      if (decision === "APPROVED") {
        setVerificationStatus("VERIFIED");
        setShowApproveDialog(false);
        // Only PENDING credentials were mass-approved; leave already-reviewed ones untouched.
        setCredentials((prev) =>
          prev.map((c) => (c.status === "PENDING" ? { ...c, status: "APPROVED" } : c)),
        );
      } else if (decision === "REJECTED") {
        setVerificationStatus("REJECTED");
        setShowRejectDialog(false);
        // Only PENDING credentials were mass-rejected; leave already-reviewed ones untouched.
        setCredentials((prev) =>
          prev.map((c) => (c.status === "PENDING" ? { ...c, status: "REJECTED" } : c)),
        );
      } else {
        // REVOKED — reset everything locally.
        setVerificationStatus("UNVERIFIED");
        setCredentials((prev) => prev.map((c) => ({ ...c, status: "PENDING" })));
      }

      router.refresh();
    });
  }

  return (
    <>
      <ApproveConfirmDialog
        credentials={pendingCredentials}
        open={showApproveDialog}
        loading={pending}
        onConfirm={() => submitDecision("APPROVED")}
        onCancel={() => setShowApproveDialog(false)}
      />
      <RejectReasonDialog
        credentials={pendingCredentials}
        open={showRejectDialog}
        loading={pending}
        onConfirm={(reason) => submitDecision("REJECTED", reason)}
        onCancel={() => setShowRejectDialog(false)}
      />

      {/* Credentials list */}
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
                onDeleted={handleCredentialDeleted}
              />
            ))}
          </ul>
        </div>
      )}

      {missingCompulsoryDocs && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {onboardingStatus === "DRAFT" ? "Dropped off during registration" : "Missing compulsory documents"}
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              {onboardingStatus === "DRAFT"
                ? "This artisan never completed onboarding and is"
                : "This artisan is"}{" "}
              yet to upload the compulsory KYC document{missingLabels.length > 1 ? "s" : ""}:{" "}
              <strong>{missingLabels.join(" and ")}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Final Decision */}
      <div className="mt-5 rounded-2xl border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Final Decision
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Approve or reject this artisan application. The decision will mass-update all uploaded
          documents and immediately reflect on the artisan&apos;s dashboard.
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
              onClick={() => setShowApproveDialog(true)}
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
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="h-4 w-4" />
              Reject Artisan
            </Button>
          </div>
        )}
        {decisionError && <p className="mt-3 text-sm text-destructive">{decisionError}</p>}
      </div>
    </>
  );
}
