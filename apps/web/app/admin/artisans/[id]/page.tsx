import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Star, Briefcase, Shield, Clock } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { userRepository } from "@/services/user/user.repository";
import { prisma } from "@/platform/prisma";
import { Badge } from "@/components/ui/badge";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import { VerificationPanel } from "@/components/admin/verification-panel";
import type { SkillCategory } from "@veyro/contracts";

const VERIFICATION_STYLE: Record<string, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-700",
  UNVERIFIED: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default async function AdminArtisanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") redirect("/sign-in");

  const { id } = await params;
  const artisan = await userRepository.findArtisanProfileFull(id);
  if (!artisan) notFound();

  // Fetch credentials from trust schema.
  const credentials = await prisma.credential.findMany({
    where: { artisanId: id },
    orderBy: { createdAt: "desc" },
  });

  const fullName = [artisan.firstName, artisan.lastName].filter(Boolean).join(" ") || "No name";
  const location = [artisan.city, artisan.state, artisan.country].filter(Boolean).join(", ");

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-10">
      <Link
        href="/admin/artisans"
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to artisans
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 rounded-2xl border bg-card p-6">
        {artisan.profilePhotoUrl ? (
          <Image
            src={artisan.profilePhotoUrl}
            alt={fullName}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {(artisan.firstName?.[0] ?? "?").toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <Badge className={VERIFICATION_STYLE[artisan.verificationStatus] ?? ""}>
              {artisan.verificationStatus}
            </Badge>
            <Badge className={STATUS_STYLE[artisan.user.status] ?? ""}>
              {artisan.user.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{artisan.user.email}</p>
          {location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {/* Skills & Experience */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Skills & Experience
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Primary skill</dt>
              <dd className="font-medium">
                {artisan.primarySkill
                  ? (SKILL_LABELS[artisan.primarySkill as SkillCategory] ?? artisan.primarySkill)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Experience</dt>
              <dd className="font-medium">{artisan.experienceLevel ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Service radius</dt>
              <dd className="font-medium">{artisan.serviceRadiusKm} km</dd>
            </div>
            {artisan.secondarySkills.length > 0 && (
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">Other skills</dt>
                <dd className="flex flex-wrap gap-1">
                  {artisan.secondarySkills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {SKILL_LABELS[s as SkillCategory] ?? s}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Performance
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="h-3.5 w-3.5" /> Rating
              </dt>
              <dd className="font-medium">
                {artisan.ratingAvg.toFixed(1)} ({artisan.ratingCount} reviews)
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> Completed jobs
              </dt>
              <dd className="font-medium">{artisan.completedJobs}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Shield className="h-3.5 w-3.5" /> Trust score
              </dt>
              <dd className="font-medium">{artisan.trustScore.toFixed(0)}/100</dd>
            </div>
            {artisan.responseTimeAvgSeconds && (
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Avg. response
                </dt>
                <dd className="font-medium">{Math.round(artisan.responseTimeAvgSeconds / 60)} min</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Bio */}
      {artisan.bio && (
        <div className="mt-5 rounded-2xl border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Bio</h2>
          <p className="text-sm leading-relaxed">{artisan.bio}</p>
        </div>
      )}

      {/* Availability */}
      {artisan.availability && (
        <div className="mt-5 rounded-2xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Availability</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Working days</dt>
              <dd className="font-medium">{artisan.availability.workingDays.join(", ") || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Hours</dt>
              <dd className="font-medium">
                {artisan.availability.startTime && artisan.availability.endTime
                  ? `${artisan.availability.startTime} – ${artisan.availability.endTime}`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Emergency available</dt>
              <dd className="font-medium">{artisan.availability.emergencyAvailable ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Portfolio */}
      {artisan.portfolio.length > 0 && (
        <div className="mt-5 rounded-2xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Portfolio ({artisan.portfolio.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {artisan.portfolio.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-lg border">
                {item.afterUrl && (
                  <Image
                    src={item.afterUrl}
                    alt={item.caption ?? "Portfolio"}
                    width={300}
                    height={200}
                    className="h-32 w-full object-cover"
                  />
                )}
                {item.caption && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">{item.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <VerificationPanel
        artisanId={artisan.id}
        initialVerificationStatus={artisan.verificationStatus as "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"}
        initialCredentials={credentials.map((c) => ({
          id: c.id,
          type: c.type,
          fileUrl: c.fileUrl,
          status: c.status,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
