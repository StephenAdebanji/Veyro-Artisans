export const dynamic = "force-dynamic";

import { ArtisanCta } from "@/components/landing/artisan-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TrustedArtisans } from "@/components/landing/trusted-artisans";
import { userService } from "@/services/user/user.service";

// Without this, Next.js prerenders the "Trusted artisans" section once at
// build time and serves that snapshot forever — trust scores and the
// featured-artisan ranking change as real activity happens, so this page
// needs to stay live.
export const revalidate = 60;

export default async function LandingPage() {
  const featuredArtisans = await userService.listFeaturedArtisans(6);

  return (
    <main className="flex-1">
      <Hero />
      <HowItWorks />
      <TrustedArtisans artisans={featuredArtisans} />
      <ArtisanCta />
    </main>
  );
}
