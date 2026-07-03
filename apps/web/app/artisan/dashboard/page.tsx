import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, CheckCircle2, ListChecks, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ArtisanJobFeed } from "@/components/dashboard/artisan-job-feed";
import { JobsTable, type JobsTableRow } from "@/components/dashboard/jobs-table";
import { auth } from "@/platform/auth-session";
import { isAvailableNow } from "@/services/user/availability";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { VerifiedBanner } from "@/components/artisan/verified-banner";
type ArtisanOnboardingStatus = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED";
type ArtisanVerificationStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";

interface ArtisanProfileRecord {
  id: string;
  firstName: string | null;
  primarySkill: import("@veyro/contracts").SkillCategory | null;
  gpsLat: number | null;
  gpsLng: number | null;
  serviceRadiusKm: number;
  trustScore: number;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  responseTimeAvgSeconds: number | null;
  totalJobsAccepted?: number;
  onboardingStatus: ArtisanOnboardingStatus;
  verificationStatus: ArtisanVerificationStatus;
  availability: {
    workingDays: string[];
    startTime: string | null;
    endTime: string | null;
    emergencyAvailable: boolean;
  } | null;
}

export default async function ArtisanDashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const artisanRef = await userService.getArtisanProfileByUserId(userId);
  if (!artisanRef) redirect("/sign-in");

  const profile = (await userService.getArtisanProfile(artisanRef.id, {
    includePrivate: true,
  })) as ArtisanProfileRecord | null;
  if (!profile) redirect("/sign-in");

  const isPendingReview =
    profile.onboardingStatus !== "ACTIVE" && profile.verificationStatus === "UNVERIFIED";
  const isRejected = profile.verificationStatus === "REJECTED";

  const [availableJobs, activeJobsCount, jobsFeed, disputesCount] = await Promise.all([
    profile.primarySkill && profile.gpsLat !== null && profile.gpsLng !== null
      ? matchingService.listAvailableRequests({
          artisanId: profile.id,
          category: profile.primarySkill,
          near: { lat: profile.gpsLat, lng: profile.gpsLng },
          radiusKm: profile.serviceRadiusKm,
        })
      : Promise.resolve([]),
    matchingService.countActiveJobsForArtisan(profile.id),
    matchingService.listJobsFeedForArtisan(profile.id),
    matchingService.countDisputesForArtisan(profile.id),
  ]);

  const homeownerIds = [...new Set(jobsFeed.map((job) => job.homeownerId))];
  const homeowners = await Promise.all(homeownerIds.map((id) => userService.getHomeownerProfile(id)));
  const nameById = new Map(homeowners.map((h, i) => [homeownerIds[i], h?.fullName ?? "Homeowner"]));
  // Pending + active first so they're never pushed off the 3-row preview.
  const allJobRows: JobsTableRow[] = jobsFeed.map((job) => ({
    ...job,
    customerName: nameById.get(job.homeownerId) ?? "Homeowner",
  }));
  const jobRows = [
    ...allJobRows.filter((r) => r.status === "PENDING" || r.status === "ACTIVE" || r.status === "IN_PROGRESS"),
    ...allJobRows.filter((r) => r.status === "COMPLETED"),
  ];

  const completionRate =
    profile.totalJobsAccepted && profile.totalJobsAccepted > 0
      ? Math.round((profile.completedJobs / profile.totalJobsAccepted) * 100)
      : null;

  return (
    <main className="flex-1 px-6 py-10">
      {profile.verificationStatus === "VERIFIED" && (
        <VerifiedBanner artisanId={profile.id} />
      )}

      {isPendingReview && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your application is being reviewed by our trust team — you&apos;ll start receiving job
          requests once verified.
        </div>
      )}

      {isRejected && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Your application was rejected.</p>
          <p className="mt-0.5">
            One or more of your verification documents could not be approved. Please go to{" "}
            <a href="/artisan/account" className="font-medium underline underline-offset-2">
              Account &rsaquo; Profile &rsaquo; KYC Verification
            </a>{" "}
            to see which documents need to be re-uploaded. Once re-submitted, your application will
            automatically return to the review queue.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })()}, {profile.firstName ?? "there"}</h1>
          <p className="text-muted-foreground">
            You have {availableJobs.length} new request{availableJobs.length === 1 ? "" : "s"} within{" "}
            {profile.serviceRadiusKm} km.
          </p>
        </div>
        <Badge variant="secondary" className="text-emerald-700">
          {isAvailableNow(profile.availability) ? "Available for jobs" : "Outside working hours"}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard icon={ListChecks} value={availableJobs.length} label="Available jobs" />
        <StatCard icon={Briefcase} value={activeJobsCount} label="Active jobs" href="/artisan/history?tab=active" />
        <StatCard icon={CheckCircle2} value={profile.completedJobs} label="Completed" href="/artisan/history?tab=completed" />
        <StatCard icon={Star} value={profile.ratingAvg.toFixed(1)} label="Rating" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="text-lg font-semibold">Available jobs near you</h2>
            <div className="mt-3">
              {profile.primarySkill && (
                <ArtisanJobFeed
                  initialJobs={availableJobs}
                  artisanId={profile.id}
                  category={profile.primarySkill}
                />
              )}
              {!profile.primarySkill && (
                <p className="text-sm text-muted-foreground">No new requests nearby right now.</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent jobs</h2>
              <Link href="/artisan/history" className="text-xs font-medium text-primary hover:underline">
                View all history →
              </Link>
            </div>
            <div className="mt-3 rounded-xl border bg-card p-4">
              <JobsTable rows={jobRows.slice(0, 3)} />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="flex items-center gap-1.5 font-semibold">Trust Score</h3>
            <p className="mt-2 text-3xl font-bold text-primary">{Math.round(profile.trustScore)}/100</p>
            <p className="text-xs text-muted-foreground">
              Based on verified identity, credentials, ratings, reviews, completion rate and response
              time.
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, profile.trustScore)}%` }} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold">Reputation</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified reviews and on-time completion drive your reputation.
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Completion rate</dt>
                <dd className="font-medium">{completionRate !== null ? `${completionRate}%` : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Response time</dt>
                <dd className="font-medium">
                  {profile.responseTimeAvgSeconds ? `${Math.round(profile.responseTimeAvgSeconds / 60)} min` : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Disputes</dt>
                <dd className="font-medium">{disputesCount}</dd>
              </div>
            </dl>
          </div>

        </div>
      </div>
    </main>
  );
}
