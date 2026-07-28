"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SKILL_LABELS, SKILL_CATEGORIES } from "@/components/shared/skill-labels";
import { apiFetch } from "@/lib/api-client";
import type { SkillCategory } from "@veyro/contracts";

export function ArtisanSkillEditor({
  artisanId,
  currentSkill,
}: {
  artisanId: string;
  currentSkill: SkillCategory | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<SkillCategory | "">(currentSkill ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cancel() {
    setSelected(currentSkill ?? "");
    setError(null);
    setEditing(false);
  }

  function save() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        await apiFetch(`/api/admin/artisans/${artisanId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primarySkill: selected }),
        });
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {currentSkill ? (SKILL_LABELS[currentSkill] ?? currentSkill) : "—"}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground"
          title="Edit service category"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          className="rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={selected}
          onChange={(e) => setSelected(e.target.value as SkillCategory)}
          autoFocus
        >
          <option value="" disabled>
            Select category
          </option>
          {SKILL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {SKILL_LABELS[cat]}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          className="h-7 w-7 p-0 bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={!selected || pending}
          onClick={save}
          title="Save"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground"
          disabled={pending}
          onClick={cancel}
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
