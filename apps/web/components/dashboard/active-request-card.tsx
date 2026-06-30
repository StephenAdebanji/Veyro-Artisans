import { Badge } from "@/components/ui/badge";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";

const STATUS_LABEL: Record<string, string> = {
  SEARCHING: "Awaiting matches",
  MATCHED: "Reviewing offers",
  IN_PROGRESS: "Active",
};

export function ActiveRequestCard({
  category,
  description,
  status,
  artisanName,
  etaMinutes,
}: {
  category: SkillCategory;
  description: string;
  status: string;
  artisanName?: string;
  etaMinutes?: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{description || SKILL_LABELS[category]}</p>
        <Badge variant={status === "IN_PROGRESS" ? "default" : "secondary"}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {artisanName
          ? `${artisanName} — Artisan on the way · ETA ${etaMinutes} min`
          : `Awaiting matches — looking for a ${SKILL_LABELS[category].toLowerCase()}`}
      </p>
    </div>
  );
}
