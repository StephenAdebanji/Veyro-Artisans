import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; badge: string; dot: string }
> = {
  SEARCHING: {
    label: "Awaiting matches",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  MATCHED: {
    label: "Reviewing offers",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    dot: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "Active",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
};

export function ActiveRequestCard({
  requestId,
  category,
  description,
  status,
  artisanName,
  etaMinutes,
}: {
  requestId: string;
  category: SkillCategory;
  description: string;
  status: string;
  artisanName?: string;
  etaMinutes?: number;
}) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SEARCHING;
  const href =
    status === "IN_PROGRESS"
      ? "/homeowner/messages"
      : `/homeowner/requests/${requestId}/matching`;

  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 rounded-xl border p-4 transition-shadow hover:shadow-md ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug">
          {description || SKILL_LABELS[category]}
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {artisanName
          ? `${artisanName} · ETA ${etaMinutes} min`
          : `Looking for a ${SKILL_LABELS[category].toLowerCase()}`}
      </p>

      {status === "SEARCHING" && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          View live search or post again
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      )}

      {status === "MATCHED" && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
          Review offers
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      )}

      {status === "IN_PROGRESS" && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Open chat
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      )}
    </Link>
  );
}
