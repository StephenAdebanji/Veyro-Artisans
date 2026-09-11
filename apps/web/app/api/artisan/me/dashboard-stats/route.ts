import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { trustService } from "@/services/trust/trust.service";
import { userService } from "@/services/user/user.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const GET = withApiErrorHandling(async () => {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artisanRef = await userService.getArtisanProfileByUserId(userId);
  if (!artisanRef) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [trustProfile, activeJobsCount, jobsFeed] = await Promise.all([
    trustService.getTrustProfile(artisanRef.id),
    matchingService.countActiveJobsForArtisan(artisanRef.id),
    matchingService.listJobsFeedForArtisan(artisanRef.id),
  ]);

  const completedJobs = jobsFeed.filter((j) => j.status === "COMPLETED").length;

  return NextResponse.json({
    trustScore: trustProfile?.score ?? 0,
    isVerified: artisanRef.verificationStatus === "VERIFIED",
    ratingAvg: trustProfile?.ratingAvg ?? 0,
    ratingCount: trustProfile?.ratingCount ?? 0,
    completedJobs: trustProfile?.completedJobs ?? completedJobs,
    totalJobsAccepted: trustProfile?.totalJobsAccepted ?? 0,
    responseTimeAvgSeconds: trustProfile?.responseTimeAvgSeconds ?? 0,
    activeJobsCount,
    completedJobsCount: completedJobs,
  });
});
