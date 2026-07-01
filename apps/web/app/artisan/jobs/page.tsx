import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { JobsTable, type JobsTableRow } from "@/components/dashboard/jobs-table";
import { prisma } from "@/platform/prisma";

export default async function ArtisanJobsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const artisan = await prisma.artisanProfile.findUnique({ where: { userId } });
  if (!artisan) redirect("/sign-in");

  // Only VERIFIED artisans can see jobs.
  if (artisan.verificationStatus !== "VERIFIED") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-semibold">Application under review</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your application is being reviewed by our team. Once approved, your jobs and offers will appear here.
          This usually takes 1–2 business days.
        </p>
      </main>
    );
  }

  const jobs = await matchingService.listJobsFeedForArtisan(artisan.id);

  const rows: JobsTableRow[] = await Promise.all(
    jobs.map(async (job) => {
      let customerName = "Homeowner";
      try {
        const homeowner = await userService.getHomeownerProfile(job.homeownerId);
        if (homeowner) customerName = homeowner.fullName ?? "Homeowner";
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
