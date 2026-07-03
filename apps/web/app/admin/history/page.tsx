import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { HistoryClient } from "@/components/history/history-client";

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    redirect("/sign-in");
  }

  const jobs = await matchingService.listAllJobsHistory();

  // Batch-fetch all artisan and homeowner profiles.
  const artisanIds = [...new Set(jobs.map((j) => j.artisanId))];
  const homeownerIds = [...new Set(jobs.map((j) => j.homeownerId))];

  const [artisans, homeowners] = await Promise.all([
    Promise.all(artisanIds.map((id) => userService.getArtisanProfile(id))),
    Promise.all(homeownerIds.map((id) => userService.getHomeownerProfile(id))),
  ]);

  const artisanNameById = new Map(
    artisans.map((a, i) => {
      const profile = a as { firstName?: string | null; lastName?: string | null } | null;
      const name = profile
        ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Artisan"
        : "Artisan";
      return [artisanIds[i], name];
    }),
  );

  const homeownerNameById = new Map(
    homeowners.map((h, i) => [homeownerIds[i], h?.fullName ?? "Client"]),
  );

  const rows = jobs.map((j) => ({
    ...j,
    artisanName: artisanNameById.get(j.artisanId) ?? "Artisan",
    homeownerName: homeownerNameById.get(j.homeownerId) ?? "Client",
  }));

  const defaultTab =
    tab === "active" ? "active" : tab === "completed" ? "completed" : "all";

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Job History</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All platform jobs — artisan, client, location, and activity timestamps.
      </p>

      <div className="mt-6">
        <HistoryClient jobs={rows} defaultTab={defaultTab as "all" | "active" | "completed"} />
      </div>
    </main>
  );
}
