"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiFetch, ApiRequestError } from "@/lib/api-client";

export function AccountDangerZone({ email }: { email: string }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const data = await apiFetch("/api/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "veyro-my-data.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof ApiRequestError ? err.message : "Failed to export your data. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch("/api/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      await signOut({ callbackUrl: "/sign-in" });
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete your account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">Export your data</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Download a copy of your account data as a JSON file.
        </p>
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
            <Download className="h-4 w-4" />
            {exporting ? "Preparing…" : "Export my data"}
          </Button>
          {exportError && <p className="mt-2 text-sm text-destructive">{exportError}</p>}
        </div>
      </section>

      <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900 dark:bg-rose-950/20">
        <h2 className="text-base font-semibold text-rose-700 dark:text-rose-400">Delete my account</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Permanently deletes your profile and personal data. This cannot be undone.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="destructive"
            className="gap-2"
            onClick={() => {
              setEmailInput("");
              setDeleteError(null);
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete my account
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        description={`This permanently deletes your VEYRO profile and personal data. To confirm, type your email address (${email}) below.`}
        confirmLabel={deleting ? "Deleting…" : "Delete my account"}
        destructive
        loading={deleting}
        confirmDisabled={emailInput.trim().toLowerCase() !== email.toLowerCase()}
        onCancel={() => { if (!deleting) setConfirmOpen(false); }}
        onConfirm={handleDelete}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="delete-email-confirm">Email address</Label>
          <Input
            id="delete-email-confirm"
            type="email"
            autoComplete="off"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={email}
          />
        </div>
        {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
      </ConfirmDialog>
    </>
  );
}
