import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, ShieldCheck, Star, CheckCircle2 } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { Badge } from "@/components/ui/badge";
import { EXPERIENCE_LABELS, SKILL_LABELS } from "@/components/shared/skill-labels";
import { EXPERIENCE_FROM_DB } from "@/services/user/experience-level.map";
import { ReviewForm } from "@/components/homeowner/review-form";
import { StartChatButton } from "@/components/homeowner/start-chat-button";
import { CallButton } from "@/components/homeowner/call-button";
import type { SkillCategory } from "@veyro/contracts";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DISPUTED: "bg-destructive/10 text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-5 w-5 ${
            n <= rating ? "fill-amber-400 stroke-amber-400" : "fill-none stroke-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default async function HomeownerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) redirect("/sign-in");

  const job = await matchingService.findJobForHomeowner(jobId, homeowner.id);
  if (!job) notFound();

  const artisan = (await userService.getArtisanProfile(job.artisanId)) as {
    firstName?: string | null;
    lastName?: string | null;
    primarySkill?: string | null;
    experienceLevel?: keyof typeof EXPERIENCE_FROM_DB | null;
    bio?: string | null;
    city?: string | null;
    state?: string | null;
    profilePhotoUrl?: string | null;
    verificationStatus?: string | null;
    trustScore?: number;
    completedJobs?: number;
    ratingAvg?: number;
    ratingCount?: number;
    user?: { phone?: string | null };
  } | null;
  const artisanPhone = artisan?.user?.phone ?? null;
  const artisanName = artisan
    ? [artisan.firstName, artisan.lastName].filter(Boolean).join(" ") || "Artisan"
    : "Artisan";
  const artisanLocation = [artisan?.city, artisan?.state].filter(Boolean).join(", ");
  const artisanExperience = artisan?.experienceLevel ? EXPERIENCE_FROM_DB[artisan.experienceLevel] : null;
  const isVerified = artisan?.verificationStatus === "VERIFIED";

  return (
    <main className="mx-auto max-w-xl flex-1 px-6 py-10">
      <Link
        href="/homeowner/dashboard"
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Job summary */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs text-muted-foreground">
              {SKILL_LABELS[job.category as SkillCategory] ?? job.category}
            </span>
            <h1 className="mt-1 text-lg font-semibold">{job.description}</h1>
          </div>
          <Badge className={STATUS_STYLE[job.status] ?? "bg-muted text-muted-foreground"}>
            {STATUS_LABEL[job.status] ?? job.status}
          </Badge>
        </div>
        <p className="mt-3 text-xl font-bold">₦{job.agreedPrice.toLocaleString()}</p>
        {job.completedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Completed {new Date(job.completedAt).toLocaleDateString("en-NG", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Artisan card */}
      <div className="mt-5 rounded-2xl border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Artisan
        </h2>
        <div className="flex items-start gap-4">
          {artisan?.profilePhotoUrl ? (
            <Image
              src={artisan.profilePhotoUrl}
              alt={artisanName}
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {artisanName[0]?.toUpperCase() ?? "A"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-semibold">{artisanName}</p>
              {isVerified && (
                <Badge variant="secondary" className="gap-1 text-emerald-700">
                  <ShieldCheck className="size-3" /> Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {artisan?.primarySkill && (SKILL_LABELS[artisan.primarySkill as SkillCategory] ?? artisan.primarySkill)}
              {artisanExperience && ` · ${EXPERIENCE_LABELS[artisanExperience]}`}
            </p>
            {artisanLocation && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {artisanLocation}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {artisan?.ratingAvg !== undefined && artisan.ratingCount ? (
                <div className="flex items-center gap-1.5">
                  <StarDisplay rating={Math.round(artisan.ratingAvg)} />
                  <span className="text-xs text-muted-foreground">
                    {artisan.ratingAvg.toFixed(1)} ({artisan.ratingCount})
                  </span>
                </div>
              ) : null}
              {artisan?.trustScore !== undefined && (
                <Badge className="bg-primary/10 text-primary">{Math.round(artisan.trustScore)}/100 Trust</Badge>
              )}
            </div>
          </div>
        </div>

        {artisan?.bio && <p className="mt-3 text-sm text-muted-foreground">{artisan.bio}</p>}

        <p className="mt-3 text-xs text-muted-foreground">
          {artisan?.completedJobs ?? 0} job{artisan?.completedJobs === 1 ? "" : "s"} completed on VEYRO
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <StartChatButton artisanId={job.artisanId} jobId={jobId} />
          <CallButton phone={artisanPhone} />
        </div>

        <Link
          href={`/artisans/${job.artisanId}`}
          className="mt-3 block text-center text-sm font-medium text-primary hover:underline"
        >
          View full profile →
        </Link>
      </div>

      {/* Review section */}
      <div className="mt-5">
        {job.status !== "COMPLETED" ? (
          <div className="rounded-2xl border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            Review will be available once the artisan marks the job as completed.
          </div>
        ) : job.hasReview && job.review ? (
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold">Your Review</h2>
            </div>
            <div className="mt-3">
              <StarDisplay rating={job.review.rating} />
              {job.review.comment && (
                <p className="mt-2 text-sm text-muted-foreground">{job.review.comment}</p>
              )}
            </div>
          </div>
        ) : (
          <ReviewForm jobId={jobId} />
        )}
      </div>
    </main>
  );
}
