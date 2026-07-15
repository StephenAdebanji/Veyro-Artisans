import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { ArtisanJobFeed } from "@/components/dashboard/artisan-job-feed";
import { JobsTable, type JobsTableRow } from "@/components/dashboard/jobs-table";
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
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
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
      <div>
        <h1 className="text-2xl font-bold">Jobs</h1>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          Available requests nearby, your pending offers, and active work.
        </p>
      </div>

      {/* Available homeowner posts — the primary section artisans come here for */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">
          Available jobs near you
          {availableJobs.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
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
          <h2 className="mb-3 text-base font-semibold">My pending offers ({pending.length})</h2>
          <div className="rounded-xl border bg-card p-4">
            <JobsTable rows={pending} />
          </div>
        </section>
      )}

      {/* Active / in-progress jobs */}
      {active.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold">In progress ({active.length})</h2>
          <div className="rounded-xl border bg-card p-4">
            <JobsTable rows={active} />
          </div>
        </section>
      )}

    </main>
  );
}
