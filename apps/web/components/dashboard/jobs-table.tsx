import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
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
  PENDING: "Pending",
  ACTIVE: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
};

export interface JobsTableRow extends JobFeedItem {
  customerName: string;
}

export function JobsTable({ rows }: { rows: JobsTableRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No jobs yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs uppercase text-muted-foreground">
          <th className="py-2 font-medium">Job</th>
          <th className="py-2 font-medium">Customer</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 text-right font-medium">Price</th>
          <th className="py-2 text-right font-medium">Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/40">
            <td className="py-3">
              <span className="line-clamp-1 font-medium">{row.description}</span>
            </td>
            <td className="py-3 text-muted-foreground">{row.customerName}</td>
            <td className="py-3">
              <Badge className={STATUS_STYLE[row.status]}>
                {STATUS_LABEL[row.status] ?? row.status}
              </Badge>
            </td>
            <td className="py-3 text-right font-medium">₦{row.price.toLocaleString()}</td>
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
  );
}
