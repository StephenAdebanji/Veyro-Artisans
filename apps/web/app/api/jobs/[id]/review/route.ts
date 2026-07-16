import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { trustService } from "@/services/trust/trust.service";
import { userService } from "@/services/user/user.service";

const reviewSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "HOMEOWNER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const homeowner = await userService.getHomeownerProfileByUserId(user.id);
  if (!homeowner) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Verify homeowner owns this job and it's completed without an existing review.
  const job = await matchingService.findJobForHomeowner(jobId, homeowner.id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status !== "COMPLETED") return NextResponse.json({ error: "Job not completed yet" }, { status: 400 });
  if (job.hasReview) return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reviewId = await matchingService.submitReview(jobId, parsed.data.rating, parsed.data.comment);
  // Sync trust score and rating immediately — can't rely on async event bus
  // in serverless/short-lived contexts where the handler might not complete.
  await trustService.applyNewReview(job.artisanId);
  return NextResponse.json({ reviewId }, { status: 201 });
}
