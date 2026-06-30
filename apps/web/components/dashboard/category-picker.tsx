"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { SKILL_CATEGORIES, SKILL_LABELS } from "@/components/shared/skill-labels";

export function CategoryPicker() {
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

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary"
      >
        <span>Which artisan are you looking for today?</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search trade…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">No trades match</li>
            )}
            {filtered.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/homeowner/requests/new?category=${c}`);
                  }}
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
  );
}
