import { NextResponse } from "next/server";
import { trustService } from "@/services/trust/trust.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const GET = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: artisanId } = await params;
  const history = await trustService.getScoreHistory(artisanId);
  return NextResponse.json({ history });
});
