import { Badge } from "@/components/ui/badge";
import type { JobFeedItem, JobFeedStatus } from "@veyro/contracts";

const STATUS_STYLE: Record<JobFeedStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-primary/10 text-primary",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DISPUTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
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
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b last:border-b-0">
            <td className="py-3">{row.description}</td>
            <td className="py-3 text-muted-foreground">{row.customerName}</td>
            <td className="py-3">
              <Badge className={STATUS_STYLE[row.status]}>
                {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
              </Badge>
            </td>
            <td className="py-3 text-right font-medium">₦{row.price.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
