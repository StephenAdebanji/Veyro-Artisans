import { matchingRepository } from "@/services/matching/matching.repository";
import { DisputeList } from "@/components/admin/dispute-list";

function toItem(d: Awaited<ReturnType<typeof matchingRepository.listOpenDisputes>>[number]) {
  return {
    id: d.id,
    jobId: d.jobId ?? "",
    raisedBy: d.raisedBy,
    raisedByName: d.raisedByUser?.name ?? null,
    raisedByEmail: d.raisedByUser?.email ?? null,
    raisedByRole: (d.raisedByUser?.role ?? null) as string | null,
    raisedByStatus: (d.raisedByUser?.status ?? null) as string | null,
    reason: d.reason,
    status: d.status as "OPEN" | "RESOLVED" | "ESCALATED",
    resolution: d.resolution ?? null,
    createdAt: d.createdAt.toISOString(),
    resolvedAt: d.resolvedAt ? d.resolvedAt.toISOString() : null,
    artisanId: d.job?.artisanId ?? null,
    homeownerId: d.job?.homeownerId ?? null,
    agreedPrice: d.job?.agreedPrice ? Number(d.job.agreedPrice) : null,
  };
}

export default async function AdminReportsPage() {
  const [openDisputes, resolvedDisputes] = await Promise.all([
    matchingRepository.listOpenDisputes(),
    matchingRepository.listResolvedDisputes(),
  ]);

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Disputes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Disputes raised by homeowners or artisans.
      </p>
      <div className="mt-6">
        <DisputeList
          openItems={openDisputes.map(toItem)}
          resolvedItems={resolvedDisputes.map(toItem)}
        />
      </div>
    </main>
  );
}
