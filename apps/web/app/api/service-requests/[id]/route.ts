import { NextResponse } from "next/server";
import { matchingService } from "@/services/matching/matching.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const GET = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const status = await matchingService.getServiceRequestStatus(id);
  return NextResponse.json({ status });
});
