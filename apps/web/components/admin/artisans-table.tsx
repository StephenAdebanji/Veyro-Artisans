"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";

type ArtisanRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primarySkill: string | null;
  verificationStatus: string;
  user: { email: string; status: string };
};

const VERIFICATION_STYLE: Record<string, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-700",
  UNVERIFIED: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
};

function ArtisanActionRow({ row }: { row: ArtisanRow }) {
  const [status, setStatus] = useState(row.user.status);
  const [removed, setRemoved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (removed) return null;

  async function toggleSuspend() {
    const action = status === "SUSPENDED" ? "activate" : "suspend";
    startTransition(async () => {
      await fetch(`/api/admin/artisans/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setStatus(action === "suspend" ? "SUSPENDED" : "ACTIVE");
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete artisan ${row.firstName ?? row.id}? This cannot be undone.`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/artisans/${row.id}`, { method: "DELETE" });
      setRemoved(true);
    });
  }

  const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || "—";

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30">
      <td className="py-3 pl-4 font-medium">{name}</td>
      <td className="py-3 text-sm text-muted-foreground">{row.user.email}</td>
      <td className="py-3">
        <Badge className="bg-violet-100 text-violet-700">Artisan</Badge>
      </td>
      <td className="py-3">
        <Badge className={VERIFICATION_STYLE[row.verificationStatus] ?? ""}>
          {row.verificationStatus}
        </Badge>
      </td>
      <td className="py-3 text-sm">
        {row.primarySkill ? (SKILL_LABELS[row.primarySkill as SkillCategory] ?? row.primarySkill) : "—"}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/admin/artisans/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Eye className="h-3.5 w-3.5" /> View
            </Button>
          </Link>
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

export function ArtisansTable({ initialRows }: { initialRows: ArtisanRow[] }) {
  if (initialRows.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No artisans registered yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-muted-foreground">
            <th className="py-3 pl-4 font-medium">Name</th>
            <th className="py-3 font-medium">Email</th>
            <th className="py-3 font-medium">Role</th>
            <th className="py-3 font-medium">Status</th>
            <th className="py-3 font-medium">Category</th>
            <th className="py-3 pr-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {initialRows.map((row) => (
            <ArtisanActionRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
