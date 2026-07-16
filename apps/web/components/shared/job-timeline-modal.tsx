"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";

interface TimelineStep {
  label: string;
  timestamp: string | null;
}

interface JobTimelineModalProps {
  open: boolean;
  onClose: () => void;
  description: string;
  category: string;
  address: string;
  agreedPrice: number;
  status: string;
  steps: TimelineStep[];
  artisanName?: string;
  homeownerName?: string;
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DISPUTED: "bg-destructive/10 text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function JobTimelineModal({
  open,
  onClose,
  description,
  category,
  address,
  agreedPrice,
  status,
  steps,
  artisanName,
  homeownerName,
}: JobTimelineModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug">{description}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Meta */}
          <div className="space-y-1.5 text-sm">
            <p className="text-muted-foreground">
              {SKILL_LABELS[category as SkillCategory] ?? category}
            </p>
            <p className="text-muted-foreground">{address}</p>
            <p className="text-lg font-bold">₦{agreedPrice.toLocaleString()}</p>
            {artisanName && (
              <p className="text-muted-foreground">
                Artisan: <span className="font-medium text-foreground">{artisanName}</span>
              </p>
            )}
            {homeownerName && (
              <p className="text-muted-foreground">
                Client: <span className="font-medium text-foreground">{homeownerName}</span>
              </p>
            )}
            <div>
              <Badge className={STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"}>
                {STATUS_LABEL[status] ?? status}
              </Badge>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative space-y-0">
            {steps.map((step, i) => {
              const done = step.timestamp !== null;
              const isLast = i === steps.length - 1;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted-foreground/30" />
                    )}
                    {!isLast && (
                      <div className="my-1 w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${done ? "" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.timestamp && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{fmt(step.timestamp)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
