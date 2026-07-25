"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, ShieldOff, ShieldCheck, KeyRound, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditArtisanModal, EditHomeownerModal, type EditArtisanData, type EditHomeownerData } from "./edit-user-modal";
import { ResetPasswordModal } from "./reset-password-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type ArtisanCombinedRow = {
  kind: "artisan";
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  primarySkill: string | null;
  location: string;
};

type HomeownerCombinedRow = {
  kind: "homeowner";
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  location: string;
};

type AdminCombinedRow = {
  kind: "admin";
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  location: string;
};

export type CombinedUserRow = ArtisanCombinedRow | HomeownerCombinedRow | AdminCombinedRow;

const ROLE_STYLE: Record<string, string> = {
  ADMIN:     "bg-rose-100 text-rose-700",
  ARTISAN:   "bg-violet-100 text-violet-700",
  HOMEOWNER: "bg-sky-100 text-sky-700",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

function displayName(row: CombinedUserRow): string {
  if (row.kind === "artisan") return [row.firstName, row.lastName].filter(Boolean).join(" ") || "—";
  if (row.kind === "homeowner") return row.fullName || "—";
  return row.name || "—";
}

function UserActionRow({ row, index }: { row: CombinedUserRow; index: number }) {
  const [data, setData] = useState(row);
  const [removed, setRemoved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  if (removed) return null;

  const apiBase = data.kind === "artisan" ? "artisans" : data.kind === "homeowner" ? "homeowners" : null;
  const name = displayName(data);
  const href = data.kind === "artisan" ? `/admin/artisans/${data.id}` : data.kind === "homeowner" ? `/admin/homeowners/${data.id}` : undefined;

  function toggleSuspend() {
    if (!apiBase) return;
    const action = data.status === "SUSPENDED" ? "activate" : "suspend";
    startTransition(async () => {
      const res = await fetch(`/api/admin/${apiBase}/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setData((prev) => ({ ...prev, status: action === "suspend" ? "SUSPENDED" : "ACTIVE" }));
      }
    });
  }

  function handleDelete() {
    if (!apiBase) return;
    startTransition(async () => {
      await fetch(`/api/admin/${apiBase}/${data.id}`, { method: "DELETE" });
      setConfirmDelete(false);
      setRemoved(true);
    });
  }

  return (
    <>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${data.kind === "artisan" ? "artisan" : "homeowner"}`}
        description={`Delete ${name}? Their account will be suspended and this cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <tr className="border-b last:border-b-0 hover:bg-muted/30">
        <td className="py-3 pl-4 text-sm text-muted-foreground">{index}</td>
        <td className="py-3 font-medium">{name}</td>
        <td className="py-3 text-sm text-muted-foreground">{data.email}</td>
        <td className="py-3">
          <Badge className={ROLE_STYLE[data.role] ?? "bg-muted text-muted-foreground"}>
            {data.role.charAt(0) + data.role.slice(1).toLowerCase()}
          </Badge>
        </td>
        <td className="py-3">
          <Badge className={STATUS_STYLE[data.status] ?? ""}>
            {data.status.charAt(0) + data.status.slice(1).toLowerCase()}
          </Badge>
        </td>
        <td className="py-3 text-sm text-muted-foreground">{data.location}</td>
        <td className="py-3 pr-4">
          <div className="flex items-center justify-end gap-1">
            {data.kind === "admin" ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              <>
                {href && (
                  <Link href={href}>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  </Link>
                )}
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
                  className={`h-7 gap-1 text-xs ${data.status === "SUSPENDED" ? "text-emerald-600" : "text-amber-600"}`}
                  disabled={pending}
                  onClick={toggleSuspend}
                >
                  {data.status === "SUSPENDED" ? (
                    <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>
                  ) : (
                    <><ShieldOff className="h-3.5 w-3.5" /> Suspend</>
                  )}
                </Button>
                {data.role !== "ADMIN" && (
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

      {data.kind === "artisan" && (
        <EditArtisanModal
          open={editOpen}
          initial={{
            id: data.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
            status: data.status,
            primarySkill: data.primarySkill,
          }}
          onClose={() => setEditOpen(false)}
          onSaved={(updated: EditArtisanData) =>
            setData((prev) =>
              prev.kind === "artisan"
                ? {
                    ...prev,
                    firstName: updated.firstName,
                    lastName: updated.lastName,
                    email: updated.email,
                    role: updated.role,
                    status: updated.status,
                    primarySkill: updated.primarySkill,
                  }
                : prev,
            )
          }
        />
      )}

      {data.kind === "homeowner" && (
        <EditHomeownerModal
          open={editOpen}
          initial={{
            id: data.id,
            fullName: data.fullName,
            email: data.email,
            role: data.role,
            status: data.status,
          }}
          onClose={() => setEditOpen(false)}
          onSaved={(updated: EditHomeownerData) =>
            setData((prev) =>
              prev.kind === "homeowner"
                ? { ...prev, fullName: updated.fullName, email: updated.email, role: updated.role, status: updated.status }
                : prev,
            )
          }
        />
      )}

      {data.kind !== "admin" && (
        <ResetPasswordModal
          open={resetOpen}
          kind={data.kind}
          id={data.id}
          name={name}
          onClose={() => setResetOpen(false)}
        />
      )}
    </>
  );
}

export function UsersTable({ initialRows }: { initialRows: CombinedUserRow[] }) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialRows;
    return initialRows.filter((row) => {
      const name = displayName(row).toLowerCase();
      return name.includes(q) || row.email.toLowerCase().includes(q);
    });
  }, [initialRows, query]);

  if (initialRows.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No users registered yet.</p>;
  }

  return (
    <div>
      <div className="border-b p-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-8"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="py-3 pl-4 font-medium">#</th>
              <th className="py-3 font-medium">Name</th>
              <th className="py-3 font-medium">Email</th>
              <th className="py-3 font-medium">Role</th>
              <th className="py-3 font-medium">Status</th>
              <th className="py-3 font-medium">Location</th>
              <th className="py-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                  No users match your search.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => <UserActionRow key={`${row.kind}-${row.id}`} row={row} index={i + 1} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
