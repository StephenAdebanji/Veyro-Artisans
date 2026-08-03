"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, ShieldOff, ShieldCheck, KeyRound, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import { EditArtisanModal, type EditArtisanData } from "./edit-user-modal";
import { ResetPasswordModal } from "./reset-password-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiFetch } from "@/lib/api-client";
import type { SkillCategory } from "@veyro/contracts";

type ArtisanRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primarySkill: string | null;
  verificationStatus: string;
  profilePhotoUrl: string | null;
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

function ArtisanActionRow({
  row,
  index,
  onDeleted,
}: {
  row: ArtisanRow;
  index: number;
  onDeleted: (id: string) => void;
}) {
  const [data, setData] = useState(row);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function toggleSuspend() {
    const action = data.user.status === "SUSPENDED" ? "activate" : "suspend";
    setActionError(null);
    startTransition(async () => {
      try {
        await apiFetch(`/api/admin/artisans/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        setData((prev) => ({
          ...prev,
          user: { ...prev.user, status: action === "suspend" ? "SUSPENDED" : "ACTIVE" },
        }));
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Could not update status.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await apiFetch(`/api/admin/artisans/${data.id}`, { method: "DELETE" });
        setConfirmDelete(false);
        // Let the dialog's exit animation finish before the row (and dialog) unmount,
        // otherwise the fixed full-screen overlay can be orphaned mid-fade and swallow
        // the next click on the page.
        setTimeout(() => onDeleted(data.id), 200);
      } catch (err) {
        setConfirmDelete(false);
        setActionError(err instanceof Error ? err.message : "Could not delete artisan.");
      }
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
      <ConfirmDialog
        open={confirmDelete}
        title="Delete artisan"
        description={`Delete ${name}? Their account will be suspended and this cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <tr className="border-b last:border-b-0 hover:bg-muted/30">
        <td className="py-3 pl-4 pr-4 text-sm text-muted-foreground">{index}</td>
        <td className="py-3 pr-4 font-medium">{name}</td>
        <td className="py-3 pr-4 text-sm text-muted-foreground">{data.user.email}</td>
        <td className="py-3 pr-4">
          <Badge className={ROLE_STYLE[data.user.role] ?? "bg-muted text-muted-foreground"}>
            {data.user.role.charAt(0) + data.user.role.slice(1).toLowerCase()}
          </Badge>
        </td>
        <td className="py-3 pr-4">
          <Badge className={STATUS_STYLE[data.user.status] ?? ""}>
            {data.user.status.charAt(0) + data.user.status.slice(1).toLowerCase()}
          </Badge>
        </td>
        <td className="py-3 pr-4 text-sm">
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
              className="h-7 gap-1 text-xs text-primary"
              onClick={() => setResetOpen(true)}
            >
              <KeyRound className="h-3.5 w-3.5" /> Reset password
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
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
        </td>
      </tr>
      {actionError && (
        <tr className="border-b last:border-b-0">
          <td colSpan={7} className="py-1.5 pl-4 pr-4 text-right text-xs text-destructive">
            {actionError}
          </td>
        </tr>
      )}

      <EditArtisanModal
        open={editOpen}
        initial={editInitial}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />
      <ResetPasswordModal
        open={resetOpen}
        kind="artisan"
        id={data.id}
        name={name}
        onClose={() => setResetOpen(false)}
      />
    </>
  );
}

export function ArtisansTable({ initialRows }: { initialRows: ArtisanRow[] }) {
  const [allRows, setAllRows] = useState(initialRows);
  const [query, setQuery] = useState("");

  function handleDeleted(id: string) {
    setAllRows((prev) => prev.filter((r) => r.id !== id));
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) => {
      const name = [row.firstName, row.lastName].filter(Boolean).join(" ").toLowerCase();
      const category = row.primarySkill
        ? (SKILL_LABELS[row.primarySkill as SkillCategory] ?? row.primarySkill).toLowerCase()
        : "";
      return name.includes(q) || row.user.email.toLowerCase().includes(q) || category.includes(q);
    });
  }, [allRows, query]);

  if (allRows.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No artisans registered yet.</p>;
  }

  return (
    <div>
      <div className="border-b p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          All registered artisans — {allRows.length} total
        </p>
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or category…"
            className="pl-8"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="py-3 pl-4 pr-4 font-medium">#</th>
              <th className="py-3 pr-4 font-medium">Name</th>
              <th className="py-3 pr-4 font-medium">Email</th>
              <th className="py-3 pr-4 font-medium">Role</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium">Category</th>
              <th className="py-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                  No artisans match your search.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <ArtisanActionRow key={row.id} row={row} index={i + 1} onDeleted={handleDeleted} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
