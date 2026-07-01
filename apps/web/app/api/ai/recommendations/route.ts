import { NextResponse } from "next/server";
import { prisma } from "@/platform/prisma";
import { aiRecommendationService } from "@/services/ai-recommendation/ai-recommendation.service";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import type { RankedArtisan } from "@veyro/contracts";

export async function GET(request: Request) {
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
    return NextResponse.json({ ranked: cached.output, cached: true });
  }

  const serviceRequest = await matchingService.getServiceRequest(serviceRequestId);
  if (!serviceRequest) {
    return NextResponse.json({ error: "Service request not found" }, { status: 404 });
  }

  const candidates = await userService.getArtisanCandidates({ category: serviceRequest.category });

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

  return NextResponse.json({ ranked, cached: false });
}
