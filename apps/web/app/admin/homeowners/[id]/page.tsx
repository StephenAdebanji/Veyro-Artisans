import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Mail, Calendar, Shield } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { userRepository } from "@/services/user/user.repository";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700",
  ARTISAN: "bg-violet-100 text-violet-700",
  HOMEOWNER: "bg-sky-100 text-sky-700",
};

export default async function AdminHomeownerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") redirect("/sign-in");

  const { id } = await params;
  const homeowner = await userRepository.findHomeownerProfileFull(id);
  if (!homeowner) notFound();

  const location = [homeowner.address, homeowner.city, homeowner.state].filter(Boolean).join(", ");

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/admin/homeowners"
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to homeowners
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 rounded-2xl border bg-card p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700">
          {(homeowner.fullName?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{homeowner.fullName ?? "No name"}</h1>
            <Badge className={ROLE_STYLE[homeowner.user.role] ?? "bg-muted text-muted-foreground"}>
              {homeowner.user.role.charAt(0) + homeowner.user.role.slice(1).toLowerCase()}
            </Badge>
            <Badge className={STATUS_STYLE[homeowner.user.status] ?? ""}>
              {homeowner.user.status}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> {homeowner.user.email}
          </p>
          {location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-5 rounded-2xl border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Account Details
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Joined
            </dt>
            <dd className="font-medium">
              {new Date(homeowner.user.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
          {homeowner.phone && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{homeowner.phone}</dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> Profile ID
            </dt>
            <dd className="font-mono text-xs text-muted-foreground">{homeowner.id}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
