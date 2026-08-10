import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { authService } from "@/services/auth/auth.service";
import { Badge } from "@/components/ui/badge";

const ACTION_STYLE: Record<string, string> = {
  VIEWED_CREDENTIAL: "bg-muted text-muted-foreground",
  APPROVED_CREDENTIAL: "bg-emerald-100 text-emerald-700",
  REJECTED_CREDENTIAL: "bg-destructive/10 text-destructive",
};

export default async function AdminAccessLogPage() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") redirect("/sign-in");

  const entries = await authService.listAdminActionLog();

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Access Log</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Audit trail of admin access to sensitive records, most recent first.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No admin actions logged yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3">{entry.adminEmail ?? entry.adminId}</td>
                  <td className="px-4 py-3">
                    <Badge className={ACTION_STYLE[entry.action] ?? ""}>{entry.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.targetType} · {entry.targetId}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
