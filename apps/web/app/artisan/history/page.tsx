import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { HistoryClient } from "@/components/history/history-client";

export default async function ArtisanHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const artisan = await userService.getArtisanProfileByUserId(userId);
  if (!artisan) redirect("/sign-in");

  const jobs = await matchingService.listJobsHistoryForArtisan(artisan.id);

  const homeownerIds = [...new Set(jobs.map((j) => j.homeownerId))];
  const homeowners = await Promise.all(homeownerIds.map((id) => userService.getHomeownerProfile(id)));
  const nameById = new Map(homeowners.map((h, i) => [homeownerIds[i], h?.fullName ?? "Client"]));

  const rows = jobs.map((j) => ({
    ...j,
    homeownerName: nameById.get(j.homeownerId) ?? "Client",
  }));

  const defaultTab =
    tab === "active" ? "active" : tab === "completed" ? "completed" : "all";

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/artisan/dashboard"
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold">Job History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All your accepted and completed jobs.
        </p>

        <div className="mt-6">
          <HistoryClient jobs={rows} defaultTab={defaultTab as "all" | "active" | "completed"} />
        </div>
      </div>
    </main>
  );
}
