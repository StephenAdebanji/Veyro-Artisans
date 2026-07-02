import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, CheckCircle2, MessageSquare, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveRequestCard } from "@/components/dashboard/active-request-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CategoryPicker } from "@/components/dashboard/category-picker";
import { auth } from "@/platform/auth-session";
import { chatService } from "@/services/chat/chat.service";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";

const EXPERIENCE_FROM_DB: Record<string, string> = {
  ZERO_TO_TWO: "0-2",
  THREE_TO_FIVE: "3-5",
  SIX_TO_TEN: "6-10",
  TEN_PLUS: "10+",
};

export default async function HomeownerDashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) redirect("/sign-in");

  const [activeRequests, completedJobs, unreadCount] = await Promise.all([
    matchingService.listActiveRequestsForHomeowner(homeowner.id),
    matchingService.listCompletedJobsForHomeowner(homeowner.id),
    chatService.countUnreadForUser(userId),
  ]);

  const requestsWithArtisanNames = await Promise.all(
    activeRequests.map(async (request) => {
      if (!request.acceptedMatch) return { request, artisanName: undefined };
      const artisan = await userService.getArtisanProfile(request.acceptedMatch.artisanId);
      const profile = artisan as { firstName?: string | null; lastName?: string | null } | null;
      const artisanName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : undefined;
      return { request, artisanName };
    }),
  );

  const activeJobsCount = activeRequests.filter((r) => r.status === "IN_PROGRESS").length;
  const completedCount = completedJobs.length;
  const pendingReviewCount = completedJobs.filter((j) => !j.hasReview).length;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {homeowner.fullName?.split(" ")[0] ?? "there"}</h1>
          <p className="text-muted-foreground">What needs fixing today?</p>
        </div>
        <Button asChild>
          <Link href="/homeowner/requests/new">
            <Plus className="size-4" /> New request
          </Link>
        </Button>
      </div>

      <div className="mt-4">
        <CategoryPicker />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Briefcase} value={activeJobsCount} label="Active jobs" />
        <StatCard icon={CheckCircle2} value={completedCount} label="Completed" />
        <StatCard icon={MessageSquare} value={unreadCount} label="Unread messages" />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Active requests</h2>
        {requestsWithArtisanNames.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No active requests yet — create one to get matched with verified artisans.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {requestsWithArtisanNames.map(({ request, artisanName }) => (
              <ActiveRequestCard
                key={request.id}
                requestId={request.id}
                jobId={request.jobId ?? undefined}
                category={request.category}
                description={request.description}
                status={request.status}
                artisanName={artisanName}
                etaMinutes={request.acceptedMatch?.etaMinutes}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed jobs */}
      {completedJobs.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Completed jobs</h2>
            {pendingReviewCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {pendingReviewCount} awaiting review
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {completedJobs.map((job) => (
              <Link
                key={job.jobId}
                href={`/homeowner/jobs/${job.jobId}`}
                className="flex items-center justify-between rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{job.description}</p>
                  <p className="text-sm text-muted-foreground">
                    ₦{job.agreedPrice.toLocaleString()}
                    {job.completedAt ? ` · ${new Date(job.completedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}` : ""}
                  </p>
                </div>
                {job.hasReview ? (
                  <span className="ml-4 flex shrink-0 items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Reviewed
                  </span>
                ) : (
                  <span className="ml-4 flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Star className="h-3 w-3" /> Leave review
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
