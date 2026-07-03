import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart2, ShieldCheck, AlertTriangle, Settings, Hammer, Home, LogOut, History } from "lucide-react";
import { auth, signOut } from "@/platform/auth-session";

const NAV = [
  { href: "/admin/console", label: "Console", icon: BarChart2 },
  { href: "/admin/artisans", label: "Artisans", icon: Hammer },
  { href: "/admin/homeowners", label: "Homeowners", icon: Home },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/reports", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/history", label: "History", icon: History },
  { href: "/admin/account", label: "Account", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col border-r bg-muted/30 px-3 py-6">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Admin
        </p>
        <nav className="flex-1 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </aside>
      <div className="ml-56 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
