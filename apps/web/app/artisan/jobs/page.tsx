import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { JobsTable, type JobsTableRow } from "@/components/dashboard/jobs-table";

export default async function ArtisanJobsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const artisan = await userService.getArtisanProfileByUserId(userId);
  if (!artisan) redirect("/sign-in");

  const jobs = await matchingService.listJobsFeedForArtisan(artisan.id);

  const rows: JobsTableRow[] = await Promise.all(
    jobs.map(async (job) => {
      let customerName = "Homeowner";
      try {
        const homeowner = await userService.getHomeownerProfile(job.homeownerId);
        if (homeowner) {
          const p = homeowner as { fullName?: string | null };
          customerName = p.fullName ?? "Homeowner";
        }
      } catch {
        // keep default
      }
      return { ...job, customerName };
    }),
  );

  const active = rows.filter((r) => r.status === "ACTIVE");
  const pending = rows.filter((r) => r.status === "PENDING");
  const completed = rows.filter((r) => r.status === "COMPLETED");
  const other = rows.filter((r) => !["ACTIVE", "PENDING", "COMPLETED"].includes(r.status));

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Jobs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All your jobs — pending offers, active work, and completed history.
      </p>

      {rows.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          No jobs yet. Once a homeowner accepts your offer, jobs will appear here.
        </p>
      )}

      {active.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold">Active ({active.length})</h2>
          <div className="rounded-xl border bg-card p-4">
            <JobsTable rows={active} />
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold">Pending offers ({pending.length})</h2>
          <div className="rounded-xl border bg-card p-4">
            <JobsTable rows={pending} />
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold">Completed ({completed.length})</h2>
          <div className="rounded-xl border bg-card p-4">
            <JobsTable rows={completed} />
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold">Other ({other.length})</h2>
          <div className="rounded-xl border bg-card p-4">
            <JobsTable rows={other} />
          </div>
        </section>
      )}
    </main>
  );
}
