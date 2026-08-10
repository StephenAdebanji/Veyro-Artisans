import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { authService } from "@/services/auth/auth.service";
import { userService } from "@/services/user/user.service";
import { matchingService } from "@/services/matching/matching.service";
import { trustService } from "@/services/trust/trust.service";
import { withApiErrorHandling } from "@/platform/api-handler";

export const GET = withApiErrorHandling(async () => {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await authService.exportUser(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role === "ARTISAN") {
    const artisan = await userService.getArtisanProfileByUserId(userId);
    const [profile, jobs, reviews, credentials] = await Promise.all([
      artisan ? (userService.getArtisanProfile(artisan.id, { includePrivate: true }) as Promise<Record<string, unknown> | null>) : null,
      artisan ? matchingService.listJobsHistoryForArtisan(artisan.id) : [],
      artisan ? matchingService.listReviewsForArtisan(artisan.id) : [],
      artisan ? trustService.listCredentialsForArtisan(artisan.id) : [],
    ]);
    return NextResponse.json({ user, profile, jobs, reviews, credentials });
  }

  if (user.role === "HOMEOWNER") {
    const homeowner = await userService.getHomeownerProfileByUserId(userId);
    const [jobs, reviews] = await Promise.all([
      homeowner ? matchingService.listJobsHistoryForHomeowner(homeowner.id) : [],
      homeowner ? matchingService.listReviewsByHomeowner(homeowner.id) : [],
    ]);
    return NextResponse.json({ user, profile: homeowner, jobs, reviews });
  }

  return NextResponse.json({ user });
});
