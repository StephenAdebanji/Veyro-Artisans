import { trustService } from "@/services/trust/trust.service";
import { VerificationQueue } from "@/components/admin/verification-queue";

export default async function AdminVerificationsPage() {
  const pending = await trustService.listPendingCredentials();
  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Verification queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review and approve credential submissions from artisans.
      </p>
      <div className="mt-6">
        <VerificationQueue initialItems={pending} />
      </div>
    </main>
  );
}
