"use client";

import { useMemo, useState } from "react";
import { TablePagination, PAGE_SIZE } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Search, X } from "lucide-react";
import { JobTimelineModal } from "@/components/shared/job-timeline-modal";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import type { JobHistoryItem, SkillCategory } from "@veyro/contracts";

type Tab = "all" | "active" | "completed";

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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

interface HistoryRowExtra {
  artisanName?: string;
  homeownerName?: string;
}

type HistoryRow = JobHistoryItem & HistoryRowExtra;

export function HistoryClient({
  jobs,
  defaultTab = "all",
}: {
  jobs: HistoryRow[];
  defaultTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [selected, setSelected] = useState<HistoryRow | null>(null);
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  function reset() { setPage(1); }
  function handleTab(t: Tab) { setTab(t); reset(); }
  function handleSearch(q: string) { setQuery(q); reset(); }
  function handleFrom(v: string) { setFromDate(v); reset(); }
  function handleTo(v: string) { setToDate(v); reset(); }
  function clearDates() { setFromDate(""); setToDate(""); reset(); }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
    return jobs.filter((j) => {
      if (tab === "active" && j.status !== "ACTIVE" && j.status !== "IN_PROGRESS") return false;
      if (tab === "completed" && j.status !== "COMPLETED") return false;
      if (q) {
        const desc = j.description.toLowerCase();
        const artisan = (j.artisanName ?? "").toLowerCase();
        const homeowner = (j.homeownerName ?? "").toLowerCase();
        const cat = (SKILL_LABELS[j.category as SkillCategory] ?? j.category).toLowerCase();
        if (!desc.includes(q) && !artisan.includes(q) && !homeowner.includes(q) && !cat.includes(q)) return false;
      }
      if (from || to) {
        const d = new Date(j.startedAt);
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return true;
    });
  }, [jobs, tab, query, fromDate, toDate]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-2 border-b pb-0">
        {tabs.map(({ key, label }) => {
          const count =
            key === "all"
              ? jobs.length
              : key === "active"
              ? jobs.filter((j) => j.status === "ACTIVE" || j.status === "IN_PROGRESS").length
              : jobs.filter((j) => j.status === "COMPLETED").length;
          return (
            <button
              key={key}
              onClick={() => handleTab(key)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by description, person, or category…" className="pl-8" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => handleFrom(e.target.value)} className="w-36" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => handleTo(e.target.value)} className="w-36" />
        </div>
        {(fromDate || toDate) && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 self-end text-xs text-muted-foreground" onClick={clearDates}>
            <X className="h-3.5 w-3.5" /> Clear dates
          </Button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No jobs here yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[580px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Date accepted</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">View</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((job) => (
                <tr
                  key={job.jobId}
                  className="border-b last:border-b-0 transition-colors hover:bg-muted/40"
                >
                  <td className="max-w-[160px] px-4 py-3">
                    <p className="truncate font-medium">{job.description}</p>
                    {(job.artisanName || job.homeownerName) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {job.artisanName ?? job.homeownerName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {SKILL_LABELS[job.category as SkillCategory] ?? job.category}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {fmtDate(job.startedAt)}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    ₦{job.agreedPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_STYLE[job.status] ?? "bg-muted text-muted-foreground"}>
                      {STATUS_LABEL[job.status] ?? job.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(job)}
                      title="View timeline"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination total={filtered.length} page={page} onPage={setPage} />
        </div>
      )}

      {selected && (
        <JobTimelineModal
          open
          onClose={() => setSelected(null)}
          description={selected.description}
          category={selected.category}
          address={selected.address}
          agreedPrice={selected.agreedPrice}
          status={selected.status}
          artisanName={selected.artisanName}
          homeownerName={selected.homeownerName}
          steps={[
            { label: "Accepted", timestamp: selected.startedAt },
            { label: "In Progress", timestamp: selected.inProgressAt },
            { label: "Completed", timestamp: selected.completedAt },
          ]}
        />
      )}
    </>
  );
}
