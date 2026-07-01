import Link from "next/link";
import { Users, ShieldCheck, Briefcase, AlertTriangle, Clock, Hammer, Home } from "lucide-react";
import { authRepository } from "@/services/auth/auth.repository";
import { userRepository } from "@/services/user/user.repository";
import { matchingRepository } from "@/services/matching/matching.repository";
import { trustService } from "@/services/trust/trust.service";

type TileColor = "blue" | "violet" | "emerald" | "amber" | "rose" | "sky";

const COLOR_CLASSES: Record<TileColor, { border: string; bg: string; icon: string; text: string; badge?: string }> = {
  blue:    { border: "border-blue-200",   bg: "bg-blue-50 dark:bg-blue-950/30",    icon: "text-blue-600",   text: "text-blue-700" },
  violet:  { border: "border-violet-200", bg: "bg-violet-50 dark:bg-violet-950/30", icon: "text-violet-600", text: "text-violet-700" },
  emerald: { border: "border-emerald-200",bg: "bg-emerald-50 dark:bg-emerald-950/30",icon:"text-emerald-600",text: "text-emerald-700" },
  sky:     { border: "border-sky-200",    bg: "bg-sky-50 dark:bg-sky-950/30",      icon: "text-sky-600",    text: "text-sky-700" },
  amber:   { border: "border-amber-300",  bg: "bg-amber-50 dark:bg-amber-950/30",  icon: "text-amber-600",  text: "text-amber-700", badge: "bg-amber-500" },
  rose:    { border: "border-rose-300",   bg: "bg-rose-50 dark:bg-rose-950/30",    icon: "text-rose-600",   text: "text-rose-700",  badge: "bg-rose-500" },
};

function StatTile({
  icon: Icon,
  value,
  label,
  href,
  color = "blue",
  actionLabel,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  href?: string;
  color?: TileColor;
  actionLabel?: string;
}) {
  const c = COLOR_CLASSES[color];
  const inner = (
    <div className={`flex flex-col gap-1 rounded-xl border p-5 transition-shadow hover:shadow-sm ${c.border} ${c.bg}`}>
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${c.icon}`} />
        {actionLabel && value > 0 && (
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${c.badge ?? "bg-primary"}`}>
            {actionLabel}
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminConsolePage() {
  const [totalUsers, verifiedArtisans, totalArtisans, totalHomeowners, activeRequests, openDisputes, pending] =
    await Promise.all([
      authRepository.countAll(),
      userRepository.countVerifiedArtisans(),
      userRepository.countAllArtisans(),
      userRepository.countAllHomeowners(),
      matchingRepository.countAllServiceRequests(),
      matchingRepository.countOpenDisputes(),
      trustService.listPendingCredentials(),
    ]);

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Admin console</h1>
      <p className="mt-1 text-sm text-muted-foreground">Platform overview — live data from all services.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile icon={Users}       value={totalUsers}      label="Total users"            href="/admin/artisans"      color="blue" />
        <StatTile icon={Hammer}      value={totalArtisans}   label="Total artisans"         href="/admin/artisans"      color="violet" />
        <StatTile icon={Home}        value={totalHomeowners} label="Total homeowners"        href="/admin/homeowners"    color="sky" />
        <StatTile icon={Briefcase}   value={activeRequests}  label="Active requests"                                   color="emerald" />
        <StatTile icon={Clock}       value={pending.length}  label="Pending verifications"  href="/admin/verifications" color="amber" actionLabel="Action needed" />
        <StatTile icon={AlertTriangle} value={openDisputes}  label="Open disputes"          href="/admin/reports"       color="rose"  actionLabel="Action needed" />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/admin/verifications"
            className="rounded-lg border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Review verification queue →
          </Link>
          <Link
            href="/admin/reports"
            className="rounded-lg border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Manage disputes →
          </Link>
          <Link
            href="/admin/artisans"
            className="rounded-lg border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Manage artisans →
          </Link>
          <Link
            href="/admin/homeowners"
            className="rounded-lg border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Manage homeowners →
          </Link>
        </div>
      </div>
    </main>
  );
}
