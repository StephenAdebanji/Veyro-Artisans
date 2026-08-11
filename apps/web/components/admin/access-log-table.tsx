"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminActionLogEntry } from "@veyro/contracts";

export type AccessLogRow = AdminActionLogEntry & {
  /** The artisan's "Name — Category" when the target resolves to one, e.g. a
   * Credential is resolved back to the artisan it belongs to. Null falls
   * back to the raw target type/id (target no longer exists, or isn't
   * artisan-related). */
  targetLabel: string | null;
};

const ACTION_STYLE: Record<string, string> = {
  VIEWED_CREDENTIAL: "bg-muted text-muted-foreground",
  APPROVED_CREDENTIAL: "bg-emerald-100 text-emerald-700",
  REJECTED_CREDENTIAL: "bg-destructive/10 text-destructive",
  VERIFIED_IDENTITY: "bg-emerald-100 text-emerald-700",
  REJECTED_IDENTITY: "bg-destructive/10 text-destructive",
  REVOKED_VERIFICATION: "bg-amber-100 text-amber-700",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-all font-medium">{value}</span>
    </div>
  );
}

export function AccessLogTable({ entries }: { entries: AccessLogRow[] }) {
  const [selected, setSelected] = useState<AccessLogRow | null>(null);

  if (entries.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No admin actions logged yet.</p>;
  }

  return (
    <>
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Admin</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Target</th>
            <th className="px-4 py-3 font-medium">When</th>
            <th className="px-4 py-3 text-right font-medium">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3">{entry.adminEmail ?? entry.adminId}</td>
              <td className="px-4 py-3">
                <Badge className={ACTION_STYLE[entry.action] ?? ""}>{entry.action}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {entry.targetLabel ?? `${entry.targetType} · ${entry.targetId}`}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setSelected(entry)}
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Access log entry</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col">
              <DetailRow label="Admin" value={selected.adminEmail ?? selected.adminId} />
              <DetailRow label="Action" value={selected.action} />
              <DetailRow label="Target" value={selected.targetLabel ?? selected.targetType} />
              <DetailRow label="Target ID" value={selected.targetId} />
              {selected.notes && <DetailRow label="Notes" value={selected.notes} />}
              <DetailRow label="When" value={new Date(selected.createdAt).toLocaleString()} />
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
