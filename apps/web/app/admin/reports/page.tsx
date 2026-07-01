import { matchingRepository } from "@/services/matching/matching.repository";
import { DisputeList } from "@/components/admin/dispute-list";

export default async function AdminReportsPage() {
  const disputes = await matchingRepository.listOpenDisputes();

  const items = disputes.map((d) => ({
    id: d.id,
    jobId: d.jobId ?? "",
    raisedBy: d.raisedBy,
    raisedByName: d.raisedByUser?.name ?? null,
    raisedByEmail: d.raisedByUser?.email ?? null,
    raisedByRole: d.raisedByUser?.role ?? null,
    reason: d.reason,
    status: d.status as "OPEN" | "RESOLVED" | "ESCALATED",
    createdAt: d.createdAt.toISOString(),
    artisanId: d.job?.artisanId ?? null,
    homeownerId: d.job?.homeownerId ?? null,
    agreedPrice: d.job?.agreedPrice ? Number(d.job.agreedPrice) : null,
  }));

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Disputes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Open disputes raised by homeowners or artisans.
      </p>
      <div className="mt-6">
        <DisputeList initialItems={items} />
      </div>
    </main>
  );
}
