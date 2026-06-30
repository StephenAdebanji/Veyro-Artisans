import { NextResponse } from "next/server";
import { matchingService } from "@/services/matching/matching.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const status = await matchingService.getServiceRequestStatus(id);
  return NextResponse.json({ status });
}
