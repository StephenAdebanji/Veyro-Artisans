"use client";

import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const user = session?.user as { name?: string; email?: string } | undefined;
  const name = user?.name ?? "—";
  const email = user?.email ?? "—";

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your admin account and preferences.</p>

        <div className="mt-8 flex flex-col gap-8">
          {/* Account info — read-only */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-base font-semibold">Account information</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Admin accounts are managed by the system.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Full name</Label>
                <Input value={name} disabled className="cursor-not-allowed opacity-60" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email address</Label>
                <Input value={email} disabled className="cursor-not-allowed opacity-60" />
              </div>
            </div>
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
