"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ExternalLink, Loader2, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PendingCredentialSummary } from "@veyro/contracts";

const CREDENTIAL_LABELS: Record<string, string> = {
  GOVERNMENT_ID: "Government ID",
  PROOF_OF_ADDRESS: "Proof of Address",
  TRADE_CERTIFICATE: "Trade Certificate",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function CredentialRow({
  item,
  onDecision,
}: {
  item: PendingCredentialSummary;
  onDecision: (id: string, decision: "APPROVED" | "REJECTED") => void;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return null;

  async function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await fetch(`/api/trust/credentials/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      onDecision(item.id, decision);
      setDone(true);
    });
  }

  const displayName = item.artisanName ?? `Artisan ${item.artisanId.slice(0, 8)}…`;

  return (
    <li className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card p-4">
      <div className="min-w-0 flex-1">
        {/* Name + credential category */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">{displayName}</span>
          </div>
          <Badge variant="outline">{CREDENTIAL_LABELS[item.type] ?? item.type}</Badge>
        </div>

        {/* Email — clickable mailto */}
        {item.artisanEmail && (
          <a
            href={`mailto:${item.artisanEmail}`}
            className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Mail className="h-3 w-3" />
            {item.artisanEmail}
          </a>
        )}

        <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/admin/artisans/${item.artisanId}`}>
          <Button variant="outline" size="sm" className="gap-1">
            <ExternalLink className="h-3 w-3" />
            View profile
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          className="border-green-300 text-green-700 hover:bg-green-50"
          disabled={pending}
          onClick={() => decide("APPROVED")}
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Approve
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-50"
          disabled={pending}
          onClick={() => decide("REJECTED")}
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
          Reject
        </Button>
      </div>
    </li>
  );
}

export function VerificationQueue({ initialItems }: { initialItems: PendingCredentialSummary[] }) {
  const [items, setItems] = useState(initialItems);

  function handleDecision(id: string, _decision: "APPROVED" | "REJECTED") {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/30 py-16">
        <CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">All clear — no pending verifications</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <CredentialRow key={item.id} item={item} onDecision={handleDecision} />
      ))}
    </ul>
  );
}
