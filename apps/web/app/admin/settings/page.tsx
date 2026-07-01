"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Sun, Moon, Monitor, Check, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const PERMISSIONS = [
  "View all users and profiles",
  "Verify artisan identities",
  "Approve or reject credentials",
  "Resolve disputes",
  "Access analytics and reports",
  "Manage platform settings",
  "View financial transactions",
  "Send system notifications",
];

export default function AdminSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();

  const user = session?.user as { name?: string | null; email?: string } | undefined;

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when session loads.
  useEffect(() => {
    if (user?.name !== undefined) setName(user.name ?? "");
    if (user?.email) setEmail(user.email);
  }, [user?.name, user?.email]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() || undefined, email: email.trim() || undefined }),
    });

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(typeof body.error === "string" ? body.error : "Failed to save changes.");
    } else {
      // Refresh the session so the navbar/header updates.
      await updateSession();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your admin account and preferences.</p>

        <div className="mt-8 flex flex-col gap-8">
          {/* Account info — editable */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-base font-semibold">Account information</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Update your display name and email address.</p>

            <form onSubmit={handleSave} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-name">Full name</Label>
                <Input
                  id="admin-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-email">Email address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="mr-1.5 h-4 w-4" /> Save changes</>
                  )}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-emerald-600">
                    <Check className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* Permissions */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-base font-semibold">Permissions</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              As an admin, you have full access to all platform capabilities.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((perm) => (
                <li key={perm} className="flex items-center gap-2.5 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  {perm}
                </li>
              ))}
            </ul>
          </section>

          {/* Appearance */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-base font-semibold">Appearance</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Choose how VEYRO looks for you.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {(
                [
                  { value: "light", icon: Sun, label: "Light" },
                  { value: "dark", icon: Moon, label: "Dark" },
                  { value: "system", icon: Monitor, label: "System" },
                ] as const
              ).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    theme === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
