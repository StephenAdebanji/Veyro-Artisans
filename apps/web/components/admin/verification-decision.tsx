"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

const STATUS_LABEL: Record<Status, { label: string; className: string }> = {
  VERIFIED:   { label: "Approved",  className: "text-emerald-600" },
  REJECTED:   { label: "Rejected",  className: "text-red-600" },
  PENDING:    { label: "Pending",   className: "text-amber-600" },
  UNVERIFIED: { label: "Unverified",className: "text-muted-foreground" },
};

export function VerificationDecision({
  artisanId,
  currentStatus,
}: {
  artisanId: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(currentStatus);

  const decided = status === "VERIFIED" || status === "REJECTED";

  async function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const res = await fetch(`/api/admin/artisans/${artisanId}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setStatus(decision === "APPROVED" ? "VERIFIED" : "REJECTED");
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-5 rounded-2xl border bg-card p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Final Decision
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Review the credentials above then make your final call on this artisan application.
      </p>

      {decided ? (
        <div className={`flex items-center gap-2 text-sm font-semibold ${STATUS_LABEL[status].className}`}>
          {status === "VERIFIED" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Decision recorded: {STATUS_LABEL[status].label}
        </div>
      ) : (
        <div className="flex gap-3">
          <Button
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={pending}
            onClick={() => decide("APPROVED")}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve Artisan
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            disabled={pending}
            onClick={() => decide("REJECTED")}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject Artisan
          </Button>
        </div>
      )}
    </div>
  );
}
