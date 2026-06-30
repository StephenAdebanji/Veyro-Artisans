import Link from "next/link";
import { ArtisanCard } from "@/components/shared/artisan-card";
import type { FeaturedArtisan } from "@veyro/contracts";

export function TrustedArtisans({ artisans }: { artisans: FeaturedArtisan[] }) {
  if (artisans.length === 0) return null;

  return (
    <section className="px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary">TOP RATED NEAR YOU</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Trusted artisans on VEYRO</h2>
        </div>
        <Link href="/sign-in" className="text-sm font-medium text-primary">
          Open dashboard →
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {artisans.map((artisan) => (
          <ArtisanCard key={artisan.artisanId} artisan={artisan} />
        ))}
      </div>
    </section>
  );
}
