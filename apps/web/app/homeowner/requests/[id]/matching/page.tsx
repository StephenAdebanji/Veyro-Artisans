import { notFound, redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { MatchingScreen } from "@/components/matching/matching-screen";
import type { OfferData } from "@/components/matching/offer-card";
import type { SkillCategory } from "@veyro/contracts";

export default async function MatchingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: serviceRequestId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) redirect("/sign-in");

  const request = await matchingService.getServiceRequest(serviceRequestId);
  if (!request || request.homeownerId !== homeowner.id) notFound();

  // Enrich existing offers with artisan display data for SSR.
  const rawOffers = await matchingService.listOffers(serviceRequestId);
  const initialOffers: OfferData[] = await Promise.all(
    rawOffers.map(async (offer) => {
      const artisan = (await userService.getArtisanProfile(offer.artisanId)) as Record<string, unknown> | null;
      return {
        matchId: offer.id,
        artisanId: offer.artisanId,
        artisanName: artisan
          ? `${String(artisan.firstName ?? "")} ${String(artisan.lastName ?? "")}`.trim()
          : "Artisan",
        ratingAvg: Number(artisan?.ratingAvg ?? 0),
        ratingCount: Number(artisan?.ratingCount ?? 0),
        trustScore: Number(artisan?.trustScore ?? 0),
        proposedPrice: offer.proposedPrice,
        etaMinutes: offer.etaMinutes,
        distanceKm: offer.distanceKm,
        status: String(offer.status),
      };
    }),
  );

  return (
    <MatchingScreen
      serviceRequestId={serviceRequestId}
      category={request.category as SkillCategory}
      description={request.description}
      address={request.address}
      budgetMin={request.budgetMin}
      budgetMax={request.budgetMax}
      createdAt={request.createdAt}
      initialOffers={initialOffers}
    />
  );
}
