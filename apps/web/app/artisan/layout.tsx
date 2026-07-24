import { redirect } from "next/navigation";
import { DashboardNavbar } from "@/components/shared/dashboard-navbar";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";

export default async function ArtisanLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const artisanRef = await userService.getArtisanProfileByUserId(userId);
  if (!artisanRef) redirect("/sign-in");

  // Artisan hasn't finished onboarding — send them back to exactly where they
  // left off. onboardingStep is the last *completed* step (1–8), so the next
  // step is step+1, capped at 8 (step 8 has the final submit button).
  if (artisanRef.onboardingStatus === "DRAFT") {
    const resumeStep = Math.max(1, Math.min(artisanRef.onboardingStep + 1, 8));
    redirect(`/join-artisan/steps/${resumeStep}?resume=${artisanRef.id}`);
  }

  const firstName = artisanRef.firstName ?? "Artisan";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DashboardNavbar role="artisan" userName={firstName} profilePhotoUrl={artisanRef.profilePhotoUrl} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
