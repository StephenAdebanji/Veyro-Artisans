import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, ShieldCheck, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReviewList, type ReviewItem } from "@/components/artisan/review-list";
import { EXPERIENCE_LABELS, SKILL_LABELS } from "@/components/shared/skill-labels";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { blockchainService } from "@/services/blockchain/blockchain.service";
import type {
  ArtisanOnboardingStatus,
  ArtisanVerificationStatusCache,
  ExperienceLevel,
  SkillCategory,
} from "@prisma/client";

interface ArtisanProfileRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  primarySkill: SkillCategory | null;
  experienceLevel: ExperienceLevel | null;
  city: string | null;
  state: string | null;
  verificationStatus: ArtisanVerificationStatusCache;
  onboardingStatus: ArtisanOnboardingStatus;
  trustScore: number;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  portfolio: Array<{ id: string; beforeUrl: string | null; afterUrl: string | null; caption: string | null }>;
}

const EXPERIENCE_FROM_DB: Record<ExperienceLevel, string> = {
  ZERO_TO_TWO: "0-2",
  THREE_TO_FIVE: "3-5",
  SIX_TO_TEN: "6-10",
  TEN_PLUS: "10+",
};

export default async function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = (await userService.getArtisanProfile(id)) as ArtisanProfileRecord | null;
  if (!profile || profile.onboardingStatus !== "ACTIVE") {
    notFound();
  }

  const [rawReviews, chainRecords] = await Promise.all([
    matchingService.listReviewsForArtisan(id),
    blockchainService.getRecordsForRef(id),
  ]);

  const latestChainRecord = chainRecords.find((r) => r.status === "CONFIRMED") ?? null;
  const reviews: ReviewItem[] = await Promise.all(
    rawReviews.map(async (review) => {
      const homeowner = await userService.getHomeownerProfile(review.homeownerId);
      return {
        id: review.id,
        reviewerName: homeowner?.fullName ?? "Verified homeowner",
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      };
    }),
  );

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Artisan";
  const initials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const isVerified = profile.verificationStatus === "VERIFIED";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="overflow-hidden rounded-xl border">
        <div className="h-24 bg-gradient-to-r from-primary to-primary/60" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="size-16 -mt-12 border-4 border-background sm:-mt-14">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{name}</h1>
                {isVerified && (
                  <Badge variant="secondary" className="gap-1 text-emerald-700">
                    <ShieldCheck className="size-3" /> Verified identity
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.primarySkill && SKILL_LABELS[profile.primarySkill]}
                {profile.experienceLevel && ` · ${EXPERIENCE_LABELS[EXPERIENCE_FROM_DB[profile.experienceLevel]]}`}
                {location && ` · ${location}`}
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {profile.ratingAvg.toFixed(1)} ({profile.ratingCount} reviews)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium"
            >
              Chat
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium"
            >
              <Phone className="size-3.5" /> Call
            </Link>
            <Link
              href={`/homeowner/requests/new?artisanId=${profile.id}&category=${profile.primarySkill ?? ""}`}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Hire
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <section>
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">ABOUT</h2>
            <p className="mt-2 text-sm">{profile.bio ?? "This artisan hasn't added a bio yet."}</p>
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">PORTFOLIO</h2>
            {profile.portfolio.length > 0 ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {profile.portfolio.map((item) => (
                  <div key={item.id} className="aspect-square rounded-lg border bg-muted" />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No portfolio photos yet.</p>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">REVIEWS</h2>
            <div className="mt-2">
              <ReviewList reviews={reviews} />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">Verification</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {["Identity", "Address proof", "Credentials"].map((label) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className={isVerified ? "text-emerald-600" : "text-muted-foreground"}>
                    {isVerified ? "Verified" : "Pending"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">Reputation</h3>
            <p className="mt-2 text-2xl font-bold text-primary">{Math.round(profile.trustScore)}/100</p>
            {latestChainRecord ? (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Anchored on-chain
                </span>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground break-all">
                  {latestChainRecord.txHash?.slice(0, 20)}…
                </p>
                {latestChainRecord.blockNumber && (
                  <p className="text-[10px] text-muted-foreground">Block #{latestChainRecord.blockNumber}</p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Pending on-chain anchor</p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">Recent work</h3>
            <p className="mt-2 text-sm text-muted-foreground">{profile.completedJobs}+ completed jobs</p>
          </div>
        </div>
      </div>
    </main>
  );
}
