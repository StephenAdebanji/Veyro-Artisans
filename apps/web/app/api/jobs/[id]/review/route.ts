import { NextResponse } from "next/server";
import { z } from "zod";
import { matchingService } from "@/services/matching/matching.service";

const reviewSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;
  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reviewId = await matchingService.submitReview(jobId, parsed.data.rating, parsed.data.comment);
  return NextResponse.json({ reviewId }, { status: 201 });
}
