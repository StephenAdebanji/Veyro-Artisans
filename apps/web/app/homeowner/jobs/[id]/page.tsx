import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, CheckCircle2 } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { Badge } from "@/components/ui/badge";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import { ReviewForm } from "@/components/homeowner/review-form";
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
    ratingAvg?: number;
    ratingCount?: number;
  } | null;
  const artisanName = artisan
    ? [artisan.firstName, artisan.lastName].filter(Boolean).join(" ") || "Artisan"
    : "Artisan";

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
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {artisanName[0]?.toUpperCase() ?? "A"}
          </div>
          <div>
            <p className="font-semibold">{artisanName}</p>
            {artisan?.primarySkill && (
              <p className="text-sm text-muted-foreground">
                {SKILL_LABELS[artisan.primarySkill as SkillCategory] ?? artisan.primarySkill}
              </p>
            )}
            {artisan?.ratingAvg !== undefined && artisan.ratingCount ? (
              <div className="mt-0.5 flex items-center gap-1.5">
                <StarDisplay rating={Math.round(artisan.ratingAvg)} />
                <span className="text-xs text-muted-foreground">
                  {artisan.ratingAvg.toFixed(1)} ({artisan.ratingCount})
                </span>
              </div>
            ) : null}
          </div>
        </div>
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
