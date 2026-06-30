import { NextResponse } from "next/server";
import { aiRecommendationService } from "@/services/ai-recommendation/ai-recommendation.service";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";

/** Used internally by the matching broadcast (Phase 7) and by the homeowner
 * dashboard's "Recommended for you" section. Gateway routes call services
 * through their ports only — never Prisma directly — which is why this needs
 * MatchingServicePort.getServiceRequest rather than reading matching.* tables. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceRequestId = url.searchParams.get("serviceRequestId");
  if (!serviceRequestId) {
    return NextResponse.json({ error: "serviceRequestId is required" }, { status: 400 });
  }

  const serviceRequest = await matchingService.getServiceRequest(serviceRequestId);
  if (!serviceRequest) {
    return NextResponse.json({ error: "Service request not found" }, { status: 404 });
  }

  const candidates = await userService.getArtisanCandidates({ category: serviceRequest.category });
  const ranked = await aiRecommendationService.rank({
    serviceRequestId,
    category: serviceRequest.category,
    location: serviceRequest.location,
    candidates,
  });

  return NextResponse.json({ ranked });
}
