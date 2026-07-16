import Link from "next/link";
import { ArrowRight, MessageCircle, Phone, Radio } from "lucide-react";
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
  jobId,
  category,
  description,
  status,
  artisanName,
  etaMinutes,
  conversationId,
  artisanPhone,
}: {
  requestId: string;
  jobId?: string;
  category: SkillCategory;
  description: string;
  status: string;
  artisanName?: string;
  etaMinutes?: number;
  conversationId?: string | null;
  artisanPhone?: string | null;
}) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SEARCHING;
  const viewHref =
    status === "IN_PROGRESS" && jobId
      ? `/homeowner/jobs/${jobId}`
      : status === "IN_PROGRESS"
      ? "/homeowner/messages"
      : `/homeowner/requests/${requestId}/matching`;

  const isActive = status === "IN_PROGRESS";

  return (
    <div className={`group flex flex-col rounded-xl border transition-shadow hover:shadow-md ${cfg.bg} ${cfg.border}`}>
      {/* Clickable header area */}
      <Link href={viewHref} className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">
            {description || SKILL_LABELS[category]}
          </p>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {artisanName
            ? `${artisanName} · ETA ${etaMinutes} min`
            : `Looking for a ${SKILL_LABELS[category].toLowerCase()}`}
        </p>

        {status === "SEARCHING" && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
            <Radio className="h-3 w-3 animate-pulse" />
            View search
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        )}

        {status === "MATCHED" && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300">
            Review offers
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        )}

        {isActive && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            View job details
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        )}
      </Link>

      {/* Action buttons — only when job is active */}
      {isActive && (
        <div className="flex gap-2 border-t border-emerald-200 px-4 py-3 dark:border-emerald-800">
          <Link
            href={conversationId ? `/homeowner/messages?c=${conversationId}` : "/homeowner/messages"}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Chat
          </Link>
          {artisanPhone ? (
            <a
              href={`tel:${artisanPhone}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          ) : (
            <button
              disabled
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-400 opacity-50 dark:border-emerald-800"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </button>
          )}
        </div>
      )}
    </div>
  );
}
