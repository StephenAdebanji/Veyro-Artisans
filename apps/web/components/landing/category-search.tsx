"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { SKILL_CATEGORIES, SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";

const POPULAR: SkillCategory[] = [
  "ELECTRICIAN",
  "PLUMBER",
  "CARPENTER",
  "AC_TECHNICIAN",
  "PAINTER",
  "TILER",
  "CLEANER",
  "AUTO_MECHANIC",
];

export function CategorySearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = SKILL_CATEGORIES.filter((c) =>
    SKILL_LABELS[c].toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(category: SkillCategory) {
    setOpen(false);
    router.push(`/sign-up?category=${category}`);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 rounded-full border bg-card px-2 py-2 pl-5 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary"
        >
          <span>Search by trade — electrician, plumber, tiler…</span>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground">
            Find artisans <ChevronDown className="size-3.5" />
          </span>
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-card shadow-lg">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Type a trade…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">No trades match</li>
              )}
              {filtered.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    {SKILL_LABELS[c]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Popular chips */}
      <div className="flex flex-wrap gap-2">
        {POPULAR.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => pick(c)}
            className="rounded-full border bg-card px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
          >
            {SKILL_LABELS[c]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          +{SKILL_CATEGORIES.length - POPULAR.length} more
        </button>
      </div>
    </div>
  );
}
