"use client";

import { useState, useTransition } from "react";
import { Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HomeownerRow = {
  id: string;
  fullName: string | null;
  city: string | null;
  state: string | null;
  user: { email: string; status: string };
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

function HomeownerActionRow({ row }: { row: HomeownerRow }) {
  const [status, setStatus] = useState(row.user.status);
  const [removed, setRemoved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (removed) return null;

  async function toggleSuspend() {
    const action = status === "SUSPENDED" ? "activate" : "suspend";
    startTransition(async () => {
      await fetch(`/api/admin/homeowners/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setStatus(action === "suspend" ? "SUSPENDED" : "ACTIVE");
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete homeowner ${row.fullName ?? row.id}? This cannot be undone.`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/homeowners/${row.id}`, { method: "DELETE" });
      setRemoved(true);
    });
  }

  const location = [row.city, row.state].filter(Boolean).join(", ") || "—";

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30">
      <td className="py-3 pl-4 font-medium">{row.fullName ?? "—"}</td>
      <td className="py-3 text-sm text-muted-foreground">{row.user.email}</td>
      <td className="py-3">
        <Badge className={STATUS_STYLE[status] ?? ""}>{status}</Badge>
      </td>
      <td className="py-3 text-sm text-muted-foreground">{location}</td>
      <td className="py-3 pr-4">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 gap-1 text-xs ${status === "SUSPENDED" ? "text-emerald-600" : "text-amber-600"}`}
            disabled={pending}
            onClick={toggleSuspend}
          >
            {status === "SUSPENDED" ? (
              <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>
            ) : (
              <><ShieldOff className="h-3.5 w-3.5" /> Suspend</>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function HomeownersTable({ initialRows }: { initialRows: HomeownerRow[] }) {
  if (initialRows.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No homeowners registered yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-muted-foreground">
            <th className="py-3 pl-4 font-medium">Name</th>
            <th className="py-3 font-medium">Email</th>
            <th className="py-3 font-medium">Status</th>
            <th className="py-3 font-medium">Location</th>
            <th className="py-3 pr-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {initialRows.map((row) => (
            <HomeownerActionRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
