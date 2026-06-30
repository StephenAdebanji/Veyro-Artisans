import { NextResponse } from "next/server";
import { matchingService } from "@/services/matching/matching.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;
  await matchingService.completeJob(jobId);
  return NextResponse.json({ ok: true });
}
