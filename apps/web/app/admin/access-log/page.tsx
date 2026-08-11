import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { authService } from "@/services/auth/auth.service";
import { trustService } from "@/services/trust/trust.service";
import { userService } from "@/services/user/user.service";
import { AccessLogTable, type AccessLogRow } from "@/components/admin/access-log-table";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";

export default async function AdminAccessLogPage() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") redirect("/sign-in");

  const entries = await authService.listAdminActionLog();

  // Credential-type entries target a Credential id — resolve those back to
  // the artisan they belong to so the table can show a name, not a raw id.
  const credentialIds = entries.filter((e) => e.targetType === "Credential").map((e) => e.targetId);
  const credentialArtisanMap = await trustService.getArtisanIdsForCredentials(credentialIds);

  const artisanIds = [
    ...new Set(
      entries
        .map((e) => (e.targetType === "Artisan" ? e.targetId : credentialArtisanMap[e.targetId]))
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const artisanProfiles = await Promise.all(artisanIds.map((id) => userService.getArtisanProfile(id)));
  const artisanLabelById = new Map<string, string>();
  artisanProfiles.forEach((profile, i) => {
    if (!profile) return;
    const p = profile as { firstName?: string | null; lastName?: string | null; primarySkill?: SkillCategory | null };
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Artisan";
    const category = p.primarySkill ? (SKILL_LABELS[p.primarySkill] ?? p.primarySkill) : null;
    artisanLabelById.set(artisanIds[i], category ? `${name} — ${category}` : name);
  });

  const rows: AccessLogRow[] = entries.map((entry) => {
    const artisanId = entry.targetType === "Artisan" ? entry.targetId : credentialArtisanMap[entry.targetId];
    return { ...entry, targetLabel: artisanId ? artisanLabelById.get(artisanId) ?? null : null };
  });

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Access Log</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Audit trail of admin access to sensitive records, most recent first.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        <AccessLogTable entries={rows} />
      </div>
    </main>
  );
}
