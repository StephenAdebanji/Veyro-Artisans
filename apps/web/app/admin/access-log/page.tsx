import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { authService } from "@/services/auth/auth.service";
import { AccessLogTable } from "@/components/admin/access-log-table";

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
        <AccessLogTable entries={entries} />
      </div>
    </main>
  );
}
