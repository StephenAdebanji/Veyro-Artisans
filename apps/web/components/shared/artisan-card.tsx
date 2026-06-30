import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EXPERIENCE_LABELS, SKILL_LABELS } from "@/components/shared/skill-labels";
import type { FeaturedArtisan } from "@veyro/contracts";

function initials(firstName: string | null, lastName: string | null): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export function ArtisanCard({ artisan }: { artisan: FeaturedArtisan }) {
  const name = [artisan.firstName, artisan.lastName].filter(Boolean).join(" ") || "Artisan";
  const location = [artisan.city, artisan.state].filter(Boolean).join(", ");

  return (
    <Link
      href={`/artisans/${artisan.artisanId}`}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{initials(artisan.firstName, artisan.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold">{name}</p>
            <Badge variant="secondary" className="gap-1 text-emerald-700">
              <ShieldCheck className="size-3" /> Verified
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {SKILL_LABELS[artisan.primarySkill]} · {EXPERIENCE_LABELS[artisan.experienceLevel]}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          {artisan.ratingAvg.toFixed(1)} ({artisan.ratingCount})
        </span>
        {location && <span className="text-muted-foreground">{location}</span>}
        <Badge className="bg-primary/10 text-primary">{Math.round(artisan.trustScore)}/100</Badge>
      </div>
    </Link>
  );
}
