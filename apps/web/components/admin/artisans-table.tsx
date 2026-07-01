"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import { EditArtisanModal, type EditArtisanData } from "./edit-user-modal";
import type { SkillCategory } from "@veyro/contracts";

type ArtisanRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primarySkill: string | null;
  verificationStatus: string;
  user: { email: string; status: string; role: string };
};

const ROLE_STYLE: Record<string, string> = {
  ADMIN:     "bg-rose-100 text-rose-700",
  ARTISAN:   "bg-violet-100 text-violet-700",
  HOMEOWNER: "bg-sky-100 text-sky-700",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

const VERIFICATION_STYLE: Record<string, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-700",
  UNVERIFIED: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
};

function ArtisanActionRow({ row, index }: { row: ArtisanRow; index: number }) {
  const [data, setData] = useState(row);
  const [removed, setRemoved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (removed) return null;

  async function toggleSuspend() {
    const action = data.user.status === "SUSPENDED" ? "activate" : "suspend";
    startTransition(async () => {
      const res = await fetch(`/api/admin/artisans/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          user: { ...prev.user, status: action === "suspend" ? "SUSPENDED" : "ACTIVE" },
        }));
      }
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete artisan ${data.firstName ?? data.id}? This cannot be undone.`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/artisans/${data.id}`, { method: "DELETE" });
      setRemoved(true);
    });
  }

  function handleSaved(updated: EditArtisanData) {
    setData((prev) => ({
      ...prev,
      firstName: updated.firstName,
      lastName: updated.lastName,
      primarySkill: updated.primarySkill,
      user: { ...prev.user, email: updated.email, role: updated.role, status: updated.status },
    }));
  }

  const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || "—";
  const editInitial: EditArtisanData = {
    id: data.id,
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.user.email,
    role: data.user.role,
    status: data.user.status,
    primarySkill: data.primarySkill,
  };

  return (
    <>
      <tr className="border-b last:border-b-0 hover:bg-muted/30">
        <td className="py-3 pl-4 text-sm text-muted-foreground">{index}</td>
        <td className="py-3 font-medium">{name}</td>
        <td className="py-3 text-sm text-muted-foreground">{data.user.email}</td>
        <td className="py-3">
          <Badge className={ROLE_STYLE[data.user.role] ?? "bg-muted text-muted-foreground"}>
            {data.user.role.charAt(0) + data.user.role.slice(1).toLowerCase()}
          </Badge>
        </td>
        <td className="py-3">
          <Badge className={STATUS_STYLE[data.user.status] ?? ""}>
            {data.user.status.charAt(0) + data.user.status.slice(1).toLowerCase()}
          </Badge>
        </td>
        <td className="py-3 text-sm">
          {data.primarySkill ? (SKILL_LABELS[data.primarySkill as SkillCategory] ?? data.primarySkill) : "—"}
        </td>
        <td className="py-3 pr-4">
          <div className="flex items-center justify-end gap-1">
            <Link href={`/admin/artisans/${data.id}`}>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Eye className="h-3.5 w-3.5" /> View
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-primary"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 gap-1 text-xs ${data.user.status === "SUSPENDED" ? "text-emerald-600" : "text-amber-600"}`}
              disabled={pending}
              onClick={toggleSuspend}
            >
              {data.user.status === "SUSPENDED" ? (
                <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>
              ) : (
                <><ShieldOff className="h-3.5 w-3.5" /> Suspend</>
              )}
            </Button>
            {data.user.role !== "ADMIN" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                disabled={pending}
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
        </td>
      </tr>

      <EditArtisanModal
        open={editOpen}
        initial={editInitial}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />
    </>
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
            <th className="py-3 pl-4 font-medium">#</th>
            <th className="py-3 font-medium">Name</th>
            <th className="py-3 font-medium">Email</th>
            <th className="py-3 font-medium">Role</th>
            <th className="py-3 font-medium">Status</th>
            <th className="py-3 font-medium">Category</th>
            <th className="py-3 pr-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {initialRows.map((row, i) => (
            <ArtisanActionRow key={row.id} row={row} index={i + 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
