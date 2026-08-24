"use client";

import { useMemo, useState, useTransition } from "react";
import { TablePagination, PAGE_SIZE } from "@/components/shared/table-pagination";
import Link from "next/link";
import { Eye, Pencil, Trash2, ShieldOff, ShieldCheck, KeyRound, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import { EditArtisanModal, type EditArtisanData } from "./edit-user-modal";
import { ResetPasswordModal } from "./reset-password-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Avatar } from "@/components/shared/avatar";
import { apiFetch } from "@/lib/api-client";
import type { SkillCategory } from "@veyro/contracts";

type ArtisanRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primarySkill: string | null;
  verificationStatus: string;
  profilePhotoUrl: string | null;
  createdAt: string;
  user: { email: string; status: string; role: string; deleteReason: string | null };
};

const ROLE_STYLE: Record<string, string> = {
  ADMIN:     "bg-rose-100 text-rose-700",
  ARTISAN:   "bg-violet-100 text-violet-700",
  HOMEOWNER: "bg-sky-100 text-sky-700",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-amber-100 text-amber-700",
  DELETED: "bg-red-100 text-red-700",
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
  const [deleteReason, setDeleteReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isDeleted = data.user.status === "DELETED";

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
        await apiFetch(`/api/admin/artisans/${data.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: deleteReason }),
        });
        setConfirmDelete(false);
        setDeleteReason("");
        setData((prev) => ({
          ...prev,
          user: { ...prev.user, status: "DELETED", deleteReason: deleteReason.trim() },
        }));
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
        description={`This will permanently deactivate ${name}'s account. Please provide a reason.`}
        confirmLabel="Delete"
        destructive
        loading={pending}
        confirmDisabled={!deleteReason.trim()}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(false); setDeleteReason(""); }}
      >
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
          maxLength={200}
          placeholder="Reason for deletion…"
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{deleteReason.length} / 200</p>
      </ConfirmDialog>
      <tr className="border-b last:border-b-0 hover:bg-muted/30">
        <td className="py-3 pl-4 pr-4 text-sm text-muted-foreground">{index}</td>
        <td className="py-3 pr-4 font-medium">
          <div className="flex items-center gap-2.5">
            <Avatar src={data.profilePhotoUrl} name={name} size={28} />
            {name}
          </div>
        </td>
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
            {!isDeleted && (
              <>
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
              </>
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  function handleDeleted(id: string) {
    setAllRows((prev) => prev.filter((r) => r.id !== id));
  }
  function reset() { setPage(1); }
  function handleSearch(q: string) { setQuery(q); reset(); }
  function handleFrom(v: string) { setFromDate(v); reset(); }
  function handleTo(v: string) { setToDate(v); reset(); }
  function clearDates() { setFromDate(""); setToDate(""); reset(); }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
    return allRows.filter((row) => {
      if (q) {
        const name = [row.firstName, row.lastName].filter(Boolean).join(" ").toLowerCase();
        const category = row.primarySkill
          ? (SKILL_LABELS[row.primarySkill as SkillCategory] ?? row.primarySkill).toLowerCase()
          : "";
        if (!name.includes(q) && !row.user.email.toLowerCase().includes(q) && !category.includes(q)) return false;
      }
      if (from || to) {
        const d = new Date(row.createdAt);
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return true;
    });
  }, [allRows, query, fromDate, toDate]);

  const rows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  if (allRows.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No artisans registered yet.</p>;
  }

  return (
    <div>
      <div className="border-b p-4">
        <p className="mb-3 text-sm text-muted-foreground">All registered artisans — {allRows.length} total</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by name, email, or category…" className="pl-8" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => handleFrom(e.target.value)} className="w-36" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => handleTo(e.target.value)} className="w-36" />
          </div>
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 self-end text-xs text-muted-foreground" onClick={clearDates}>
              <X className="h-3.5 w-3.5" /> Clear dates
            </Button>
          )}
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
                <ArtisanActionRow
                  key={row.id}
                  row={row}
                  index={(page - 1) * PAGE_SIZE + i + 1}
                  onDeleted={handleDeleted}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination total={filtered.length} page={page} onPage={setPage} />
    </div>
  );
}
