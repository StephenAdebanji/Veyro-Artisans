import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, CheckCircle2, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArtisanCard } from "@/components/shared/artisan-card";
import { SKILL_CATEGORIES, SKILL_LABELS } from "@/components/shared/skill-labels";
import { ActiveRequestCard } from "@/components/dashboard/active-request-card";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  RecommendedArtisanCard,
  type RecommendedArtisanData,
} from "@/components/dashboard/recommended-artisan-card";
import { auth } from "@/platform/auth-session";
import { chatService } from "@/services/chat/chat.service";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { aiRecommendationService } from "@/services/ai-recommendation/ai-recommendation.service";
import type { SkillCategory } from "@veyro/contracts";

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

  const [activeRequests, completedCount, unreadCount] = await Promise.all([
    matchingService.listActiveRequestsForHomeowner(homeowner.id),
    matchingService.countCompletedRequestsForHomeowner(homeowner.id),
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

  // AI recommendations: rank candidates for the most recent SEARCHING request.
  const searchingRequest = activeRequests.find((r) => r.status === "SEARCHING") ?? null;

  let aiRecommended: RecommendedArtisanData[] = [];
  let recommendationContext: string | null = null;

  if (searchingRequest) {
    const fullRequest = await matchingService.getServiceRequest(searchingRequest.id);
    if (fullRequest) {
      const candidates = await userService.getArtisanCandidates({ category: fullRequest.category });
      const ranked = await aiRecommendationService.rank({
        serviceRequestId: fullRequest.id,
        category: fullRequest.category,
        location: fullRequest.location,
        candidates,
      });

      aiRecommended = (
        await Promise.all(
          ranked.slice(0, 3).map(async ({ artisanId, score, breakdown }) => {
            const p = (await userService.getArtisanProfile(artisanId)) as Record<string, unknown> | null;
            if (!p) return null;
            return {
              artisanId,
              firstName: (p.firstName as string | null) ?? null,
              lastName: (p.lastName as string | null) ?? null,
              primarySkill: (p.primarySkill as SkillCategory | null) ?? null,
              experienceLevel: p.experienceLevel
                ? (EXPERIENCE_FROM_DB[p.experienceLevel as string] ?? null)
                : null,
              city: (p.city as string | null) ?? null,
              state: (p.state as string | null) ?? null,
              ratingAvg: Number(p.ratingAvg ?? 0),
              ratingCount: Number(p.ratingCount ?? 0),
              trustScore: Number(p.trustScore ?? 0),
              score,
              breakdown,
            } satisfies RecommendedArtisanData;
          }),
        )
      ).filter((a): a is RecommendedArtisanData => a !== null);

      recommendationContext = searchingRequest.description;
    }
  }

  // Fall back to featured artisans when there's no active searching request
  // or the AI engine returned no eligible candidates.
  const featuredArtisans = aiRecommended.length === 0 ? await userService.listFeaturedArtisans(3) : [];

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

      <div className="mt-4 flex flex-wrap gap-2">
        {SKILL_CATEGORIES.map((category) => (
          <Link key={category} href={`/homeowner/requests/new?category=${category}`}>
            <span className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary">
              {SKILL_LABELS[category]}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Briefcase} value={activeJobsCount} label="Active jobs" />
        <StatCard icon={CheckCircle2} value={completedCount} label="Completed" />
        <StatCard icon={MessageSquare} value={unreadCount} label="Unread messages" />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active requests</h2>
          <Link href="/homeowner/requests/new" className="text-sm font-medium text-primary">
            View matching →
          </Link>
        </div>
        {requestsWithArtisanNames.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No active requests yet — create one to get matched with verified artisans.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {requestsWithArtisanNames.map(({ request, artisanName }) => (
              <ActiveRequestCard
                key={request.id}
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

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {aiRecommended.length > 0 ? "Best matches for your request" : "Recommended for you"}
          </h2>
          {recommendationContext && (
            <span className="truncate text-sm text-muted-foreground" title={recommendationContext}>
              "{recommendationContext.slice(0, 48)}{recommendationContext.length > 48 ? "…" : ""}"
            </span>
          )}
        </div>

        {aiRecommended.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aiRecommended.map((artisan) => (
              <RecommendedArtisanCard key={artisan.artisanId} artisan={artisan} />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredArtisans.map((artisan) => (
              <ArtisanCard key={artisan.artisanId} artisan={artisan} />
            ))}
          </div>
        )}

        {aiRecommended.length === 0 && featuredArtisans.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Post a request to see AI-ranked artisans tailored to your job.
          </p>
        )}
      </section>
    </main>
  );
}
