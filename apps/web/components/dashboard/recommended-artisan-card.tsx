import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EXPERIENCE_LABELS, SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";

export interface RecommendedArtisanData {
  artisanId: string;
  firstName: string | null;
  lastName: string | null;
  primarySkill: SkillCategory | null;
  experienceLevel: string | null;
  city: string | null;
  state: string | null;
  ratingAvg: number;
  ratingCount: number;
  trustScore: number;
  score: number;
  breakdown: {
    skillMatch: number;
    distance: number;
    experience: number;
    trust: number;
  };
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/70 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
        {pct}%
      </span>
    </div>
  );
}

export function RecommendedArtisanCard({ artisan }: { artisan: RecommendedArtisanData }) {
  const name = [artisan.firstName, artisan.lastName].filter(Boolean).join(" ") || "Artisan";
  const initials = `${artisan.firstName?.[0] ?? ""}${artisan.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const location = [artisan.city, artisan.state].filter(Boolean).join(", ");
  const matchPct = Math.round(artisan.score * 100);

  return (
    <Link
      href={`/homeowner/requests/new?artisan=${artisan.artisanId}`}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold">{name}</span>
            <Badge
              variant="secondary"
              className={`shrink-0 text-xs font-semibold ${
                matchPct >= 80 ? "text-emerald-700" : matchPct >= 60 ? "text-primary" : ""
              }`}
            >
              {matchPct}% match
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {artisan.primarySkill && SKILL_LABELS[artisan.primarySkill]}
            {artisan.experienceLevel && ` · ${EXPERIENCE_LABELS[artisan.experienceLevel] ?? artisan.experienceLevel}`}
            {location && ` · ${location}`}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {artisan.ratingAvg.toFixed(1)} ({artisan.ratingCount})
            <span className="ml-1 font-medium text-foreground">
              {Math.round(artisan.trustScore)}/100 trust
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-1 border-t pt-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Why this match
        </p>
        <BreakdownBar label="Skill" value={artisan.breakdown.skillMatch} />
        <BreakdownBar label="Distance" value={artisan.breakdown.distance} />
        <BreakdownBar label="Experience" value={artisan.breakdown.experience} />
        <BreakdownBar label="Trust" value={artisan.breakdown.trust} />
      </div>
    </Link>
  );
}
