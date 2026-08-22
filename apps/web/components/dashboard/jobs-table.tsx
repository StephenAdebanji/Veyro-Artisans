"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { TablePagination, PAGE_SIZE } from "@/components/shared/table-pagination";
import type { JobFeedItem, JobFeedStatus } from "@veyro/contracts";

const STATUS_STYLE: Record<JobFeedStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-primary/10 text-primary",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DISPUTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<JobFeedStatus, string> = {
  PENDING: "Offer",
  ACTIVE: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
};

export interface JobsTableRow extends JobFeedItem {
  customerName: string;
}

export function JobsTable({ rows: allRows }: { rows: JobsTableRow[] }) {
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () => allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allRows, page],
  );

  if (allRows.length === 0) {
    return <p className="text-sm text-muted-foreground">No jobs yet.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Job</th>
              <th className="hidden pb-2 pr-4 font-medium sm:table-cell">Customer</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="hidden pb-2 text-right font-medium md:table-cell">Price</th>
              <th className="pb-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/40">
                <td className="py-3 pr-4">
                  <p className="line-clamp-2 max-w-[120px] break-words font-medium sm:max-w-[200px] lg:max-w-none">
                    {row.description}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground sm:hidden">
                    {row.customerName}
                  </p>
                </td>
                <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">
                  {row.customerName}
                </td>
                <td className="py-3 pr-4">
                  <Badge className={`shrink-0 whitespace-nowrap ${STATUS_STYLE[row.status]}`}>
                    {STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                </td>
                <td className="hidden py-3 text-right font-medium md:table-cell">
                  ₦{row.price.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  <Link href={`/artisan/jobs/${row.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination total={allRows.length} page={page} onPage={setPage} />
    </div>
  );
}
