import { NextResponse } from "next/server";
import { matchingService } from "@/services/matching/matching.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const POST = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: jobId } = await params;
  await matchingService.completeJob(jobId);
  return NextResponse.json({ ok: true });
});
