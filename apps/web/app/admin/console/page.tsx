import Link from "next/link";
import { Users, ShieldCheck, Briefcase, AlertTriangle, Clock } from "lucide-react";
import { authRepository } from "@/services/auth/auth.repository";
import { userRepository } from "@/services/user/user.repository";
import { matchingRepository } from "@/services/matching/matching.repository";
import { trustService } from "@/services/trust/trust.service";

function StatTile({
  icon: Icon,
  value,
  label,
  href,
  urgent,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  href?: string;
  urgent?: boolean;
}) {
  const inner = (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-5 ${
        urgent && value > 0 ? "border-amber-300 bg-amber-50" : "bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${urgent && value > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
        {urgent && value > 0 && (
          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            Action needed
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold ${urgent && value > 0 ? "text-amber-700" : ""}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminConsolePage() {
  const [totalUsers, verifiedArtisans, activeRequests, openDisputes, pending] = await Promise.all([
    authRepository.countAll(),
    userRepository.countVerifiedArtisans(),
    matchingRepository.countAllServiceRequests(),
    matchingRepository.countOpenDisputes(),
    trustService.listPendingCredentials(),
  ]);

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Admin console</h1>
      <p className="mt-1 text-sm text-muted-foreground">Platform overview — live data from all services.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile icon={Users} value={totalUsers} label="Total users" />
        <StatTile icon={ShieldCheck} value={verifiedArtisans} label="Verified artisans" />
        <StatTile icon={Briefcase} value={activeRequests} label="Active requests" />
        <StatTile
          icon={Clock}
          value={pending.length}
          label="Pending verifications"
          href="/admin/verifications"
          urgent
        />
        <StatTile
          icon={AlertTriangle}
          value={openDisputes}
          label="Open disputes"
          href="/admin/reports"
          urgent
        />
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
        </div>
      </div>
    </main>
  );
}
