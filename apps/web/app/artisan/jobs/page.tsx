import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Briefcase, Clock, ListChecks, Zap } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { ArtisanJobFeed } from "@/components/dashboard/artisan-job-feed";
import { JobsTable, type JobsTableRow } from "@/components/dashboard/jobs-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/platform/prisma";
import type { SkillCategory } from "@veyro/contracts";

export default async function ArtisanJobsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const artisan = await prisma.artisanProfile.findUnique({ where: { userId } });
  if (!artisan) redirect("/sign-in");

  // Only VERIFIED artisans can see jobs.
  if (artisan.verificationStatus !== "VERIFIED") {
    return (
      <main className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <Link
          href="/artisan/dashboard"
          className="absolute left-6 top-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-semibold">Application under review</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your application is being reviewed by our team. Once approved, your jobs and offers will appear here.
          This usually takes 1–2 business days.
        </p>
      </main>
    );
  }

  const [availableJobs, jobs] = await Promise.all([
    artisan.primarySkill
      ? matchingService.listAvailableRequests({
          artisanId: artisan.id,
          category: artisan.primarySkill as SkillCategory,
          near: artisan.gpsLat !== null && artisan.gpsLng !== null
            ? { lat: artisan.gpsLat, lng: artisan.gpsLng }
            : null,
          radiusKm: artisan.serviceRadiusKm,
        })
      : Promise.resolve([]),
    matchingService.listJobsFeedForArtisan(artisan.id),
  ]);

  const rows: JobsTableRow[] = await Promise.all(
    jobs.map(async (job) => {
      let customerName = "Homeowner";
      try {
        const homeowner = await userService.getHomeownerProfile(job.homeownerId);
        if (homeowner) customerName = homeowner.fullName ?? "Homeowner";
      } catch {
        // keep default
      }
      return { ...job, customerName };
    }),
  );

  const pending = rows.filter((r) => r.status === "PENDING");
  const active = rows.filter((r) => r.status === "ACTIVE" || r.status === "IN_PROGRESS");

  return (
    <main className="flex-1 px-6 py-10">
      <Link
        href="/artisan/dashboard"
        className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="flex items-center gap-3 rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Available requests nearby, your pending offers, and active work.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={ListChecks} value={availableJobs.length} label="Available jobs" />
        <StatCard icon={Zap} value={pending.length} label="Pending offers" />
        <StatCard icon={Clock} value={active.length} label="In progress" />
      </div>

      {/* Available homeowner posts — the primary section artisans come here for */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <ListChecks className="h-4 w-4 text-primary" />
          Available jobs near you
          {availableJobs.length > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {availableJobs.length} new
            </span>
          )}
        </h2>
        {artisan.primarySkill ? (
          <ArtisanJobFeed
            initialJobs={availableJobs}
            artisanId={artisan.id}
            category={artisan.primarySkill as SkillCategory}
            artisanLat={artisan.gpsLat ?? undefined}
            artisanLng={artisan.gpsLng ?? undefined}
            serviceRadiusKm={artisan.serviceRadiusKm}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete your profile (set your trade category) to see available jobs.
          </p>
        )}
      </section>

      {/* Pending offers the artisan has sent */}
      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Zap className="h-4 w-4 text-amber-500" />
            My pending offers ({pending.length})
          </h2>
          <div className="rounded-xl border bg-card p-4">
            <JobsTable rows={pending} />
          </div>
        </section>
      )}

      {/* Active / in-progress jobs */}
      {active.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-blue-500" />
            In progress ({active.length})
          </h2>
          <div className="rounded-xl border bg-card p-4">
            <JobsTable rows={active} />
          </div>
        </section>
      )}

    </main>
  );
}
