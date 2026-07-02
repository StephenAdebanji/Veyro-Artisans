"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  User,
  Mail,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PendingCredentialSummary } from "@veyro/contracts";

const TYPE_LABELS: Record<string, string> = {
  NIN: "Voter's ID",
  NATIONAL_ID: "National ID",
  DRIVERS_LICENSE: "Driver's License",
  PASSPORT: "Passport",
  UTILITY_BILL: "Utility Bill",
  TRADE_CERTIFICATE: "Trade Certificate",
  LICENSE: "Professional License",
  GOVERNMENT_ID: "Government ID",
  PROOF_OF_ADDRESS: "Proof of Address",
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

type ArtisanGroup = {
  artisanId: string;
  artisanName: string | null;
  artisanEmail: string | null;
  credentials: PendingCredentialSummary[];
  earliestDate: string;
};

function groupByArtisan(items: PendingCredentialSummary[]): ArtisanGroup[] {
  const map = new Map<string, ArtisanGroup>();
  for (const item of items) {
    const existing = map.get(item.artisanId);
    if (existing) {
      existing.credentials.push(item);
      if (item.createdAt < existing.earliestDate) existing.earliestDate = item.createdAt;
    } else {
      map.set(item.artisanId, {
        artisanId: item.artisanId,
        artisanName: item.artisanName,
        artisanEmail: item.artisanEmail,
        credentials: [item],
        earliestDate: item.createdAt,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.earliestDate.localeCompare(b.earliestDate));
}

function CredentialLine({
  credential,
  onResolved,
}: {
  credential: PendingCredentialSummary;
  onResolved: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return null;

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await fetch(`/api/trust/credentials/${credential.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      setDone(true);
      onResolved(credential.id);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium">
          {TYPE_LABELS[credential.type] ?? credential.type}
        </span>
        <span className="text-xs text-muted-foreground">{formatDateTime(credential.createdAt)}</span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={credential.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs text-primary hover:bg-muted"
        >
          <Eye className="h-3 w-3" /> View
        </a>
        <Button
          variant="outline"
          size="sm"
          className="h-7 border-green-300 text-green-700 hover:bg-green-50"
          disabled={pending}
          onClick={() => decide("APPROVED")}
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 border-red-300 text-red-700 hover:bg-red-50"
          disabled={pending}
          onClick={() => decide("REJECTED")}
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
          Reject
        </Button>
      </div>
    </div>
  );
}

function ArtisanCard({
  group,
  onResolved,
}: {
  group: ArtisanGroup;
  onResolved: (credentialId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayName = group.artisanName ?? `Artisan ${group.artisanId.slice(0, 8)}…`;
  const count = group.credentials.length;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">{displayName}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {count} document{count !== 1 ? "s" : ""} pending
            </Badge>
          </div>
          {group.artisanEmail && (
            <a
              href={`mailto:${group.artisanEmail}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Mail className="h-3 w-3" />
              {group.artisanEmail}
            </a>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {formatDateTime(group.earliestDate)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/admin/artisans/${group.artisanId}?from=verifications`} onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-3 w-3" />
              View profile
            </Button>
          </Link>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded credentials */}
      {expanded && (
        <div className="flex flex-col gap-2 border-t px-4 pb-4 pt-3">
          {group.credentials.map((cred) => (
            <CredentialLine key={cred.id} credential={cred} onResolved={onResolved} />
          ))}
        </div>
      )}
    </div>
  );
}

export function VerificationQueue({ initialItems }: { initialItems: PendingCredentialSummary[] }) {
  const [items, setItems] = useState(initialItems);

  function handleResolved(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const groups = groupByArtisan(items);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/30 py-16">
        <CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">All clear — no pending verifications</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <ArtisanCard key={group.artisanId} group={group} onResolved={handleResolved} />
      ))}
    </div>
  );
}
