import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock, Hammer } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { ArtisanJobsTabs } from "@/components/artisan/jobs-tabs";
import { type JobsTableRow } from "@/components/dashboard/jobs-table";
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

  const [availableJobs, jobs, declinedNotices] = await Promise.all([
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
    matchingService.listRecentlyDeclinedForArtisan(artisan.id),
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

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/70 px-6 py-8 text-primary-foreground">
        <Hammer className="absolute -right-4 -top-4 h-32 w-32 rotate-12 text-white/10" />
        <h1 className="text-2xl font-bold">Find your next job</h1>
        <p className="mt-1 max-w-md text-sm text-primary-foreground/80">
          Browse requests nearby, track the offers you&apos;ve sent, and follow the jobs currently in progress.
        </p>
      </div>

      <div className="mt-6">
        <ArtisanJobsTabs
          availableJobs={availableJobs}
          artisanId={artisan.id}
          category={(artisan.primarySkill as SkillCategory) ?? null}
          artisanLat={artisan.gpsLat ?? undefined}
          artisanLng={artisan.gpsLng ?? undefined}
          serviceRadiusKm={artisan.serviceRadiusKm}
          pendingRows={pending}
          activeRows={active}
          initialDeclinedNotices={declinedNotices}
        />
      </div>
    </main>
  );
}
