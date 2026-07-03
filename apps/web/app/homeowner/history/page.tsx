import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { HistoryClient } from "@/components/history/history-client";

export default async function HomeownerHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const homeowner = await userService.getHomeownerProfileByUserId(userId);
  if (!homeowner) redirect("/sign-in");

  const jobs = await matchingService.listJobsHistoryForHomeowner(homeowner.id);

  const artisanIds = [...new Set(jobs.map((j) => j.artisanId))];
  const artisans = await Promise.all(artisanIds.map((id) => userService.getArtisanProfile(id)));
  const nameById = new Map(
    artisans.map((a, i) => {
      const profile = a as { firstName?: string | null; lastName?: string | null } | null;
      const name = profile
        ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Artisan"
        : "Artisan";
      return [artisanIds[i], name];
    }),
  );

  const rows = jobs.map((j) => ({
    ...j,
    artisanName: nameById.get(j.artisanId) ?? "Artisan",
  }));

  const defaultTab =
    tab === "active" ? "active" : tab === "completed" ? "completed" : "all";

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/homeowner/dashboard"
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
