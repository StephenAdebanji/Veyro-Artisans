import { NextResponse } from "next/server";
import { prisma } from "@/platform/prisma";
import { aiRecommendationService } from "@/services/ai-recommendation/ai-recommendation.service";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { withApiErrorHandling } from "@/platform/api-handler";
import { haversineKm } from "@/platform/geo";
import type { RankedArtisan } from "@veyro/contracts";

// Profile photos aren't part of the persisted RecommendationLog snapshot (and
// could change since it was cached anyway) — always fetched fresh rather than
// trusting whatever was true at scoring time.
async function withProfilePhotos(ranked: RankedArtisan[]): Promise<RankedArtisan[]> {
  const profiles = await Promise.all(ranked.map((r) => userService.getArtisanProfile(r.artisanId)));
  return ranked.map((r, i) => ({
    ...r,
    artisanProfilePhotoUrl: (profiles[i] as { profilePhotoUrl?: string | null } | null)?.profilePhotoUrl ?? null,
  }));
}

export const GET = withApiErrorHandling(async (request: Request) => {
  const url = new URL(request.url);
  const serviceRequestId = url.searchParams.get("serviceRequestId");
  if (!serviceRequestId) {
    return NextResponse.json({ error: "serviceRequestId is required" }, { status: 400 });
  }

  // Return cached result if already computed for this request.
  const cached = await prisma.recommendationLog.findFirst({
    where: { serviceRequestId },
    orderBy: { createdAt: "desc" },
  });
  if (cached) {
    const ranked = await withProfilePhotos(cached.output as unknown as RankedArtisan[]);
    return NextResponse.json({ ranked, cached: true });
  }

  const serviceRequest = await matchingService.getServiceRequest(serviceRequestId);
  if (!serviceRequest) {
    return NextResponse.json({ error: "Service request not found" }, { status: 404 });
  }

  const allCandidates = await userService.getArtisanCandidates({ category: serviceRequest.category });

  // getArtisanCandidates only filters by category — it doesn't know about this
  // specific request's location, so distance never factored into ranking at
  // all. Filter here to each candidate's own service radius from the request,
  // the same "would they actually take this job" check the artisan's own job
  // feed already applies (matchingService.listAvailableRequests).
  const candidates = allCandidates.filter(
    (c) => haversineKm(serviceRequest.location, c.location) <= c.serviceRadiusKm,
  );

  // Enrich candidates with bios and names for Claude semantic scoring.
  const profiles = await Promise.all(
    candidates.map((c) => userService.getArtisanProfile(c.artisanId)),
  );

  const artisanBios: Record<string, string> = {};
  const artisanNames: Record<string, string> = {};

  candidates.forEach((c, i) => {
    const p = profiles[i] as { bio?: string | null; firstName?: string | null; lastName?: string | null } | null;
    artisanBios[c.artisanId] = p?.bio ?? "";
    artisanNames[c.artisanId] = [p?.firstName, p?.lastName].filter(Boolean).join(" ") || "Artisan";
  });

  const ranked = await aiRecommendationService.rank({
    serviceRequestId,
    category: serviceRequest.category,
    location: serviceRequest.location,
    description: serviceRequest.description,
    candidates,
    artisanBios,
    artisanNames,
  });

  return NextResponse.json({ ranked: await withProfilePhotos(ranked), cached: false });
});
