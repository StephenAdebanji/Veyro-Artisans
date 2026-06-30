import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart2, ShieldCheck, AlertTriangle, Settings } from "lucide-react";
import { auth } from "@/platform/auth-session";

const NAV = [
  { href: "/admin/console", label: "Console", icon: BarChart2 },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/reports", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r bg-muted/30 px-3 py-6">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Admin
        </p>
        <nav className="space-y-1">
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
      </aside>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
