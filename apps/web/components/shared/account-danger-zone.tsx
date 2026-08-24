"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { CheckCircle2, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch, ApiRequestError } from "@/lib/api-client";

export function AccountDangerZone({ email }: { email: string }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletedOpen, setDeletedOpen] = useState(false);

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
      // Kill the session cookie now, but don't let next-auth navigate —
      // we show our own "account deleted" dialog first, and the eventual
      // navigation needs to *replace* history (see handleReturnHome) so the
      // back button can never land on this now-deleted account page again.
      await signOut({ redirect: false });
      setConfirmOpen(false);
      setDeleting(false);
      setDeletedOpen(true);
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete your account. Please try again.");
      setDeleting(false);
    }
  }

  function handleReturnHome() {
    // A hard navigation that replaces the current history entry (rather than
    // a Next.js router.push, which would leave this deleted-account page as
    // a "back" target) so pressing the browser back button afterward skips
    // straight past it.
    window.location.replace("/");
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
          Deactivates your account immediately. Your data will be permanently removed by an admin after review.
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
        description={`This will deactivate your account immediately. You will be signed out and will no longer be able to log in. To confirm, type your email address (${email}) below.`}
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

      <Dialog open={deletedOpen}>
        <DialogContent
          className="max-w-sm"
          showCloseButton={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="items-center text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <DialogTitle>Account deleted</DialogTitle>
            <DialogDescription>
              Your VEYRO account has been deactivated. Your data will be permanently removed by an admin after review.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleReturnHome} className="w-full">
            Return to homepage
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
