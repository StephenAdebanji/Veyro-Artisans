"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  location: string;
  createdAt: string;
  href?: string;
};

const ROLE_STYLE: Record<string, string> = {
  ADMIN:     "bg-rose-100 text-rose-700",
  ARTISAN:   "bg-violet-100 text-violet-700",
  HOMEOWNER: "bg-sky-100 text-sky-700",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export function UsersTable({ initialRows }: { initialRows: UserRow[] }) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialRows;
    return initialRows.filter(
      (row) => row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q),
    );
  }, [initialRows, query]);

  if (initialRows.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No users registered yet.</p>;
  }

  return (
    <div>
      <div className="border-b p-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-8"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="py-3 pl-4 font-medium">#</th>
              <th className="py-3 font-medium">Name</th>
              <th className="py-3 font-medium">Email</th>
              <th className="py-3 font-medium">Role</th>
              <th className="py-3 font-medium">Status</th>
              <th className="py-3 font-medium">Location</th>
              <th className="py-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                  No users match your search.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 pl-4 text-sm text-muted-foreground">{i + 1}</td>
                  <td className="py-3 font-medium">{row.name}</td>
                  <td className="py-3 text-sm text-muted-foreground">{row.email}</td>
                  <td className="py-3">
                    <Badge className={ROLE_STYLE[row.role] ?? "bg-muted text-muted-foreground"}>
                      {row.role.charAt(0) + row.role.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge className={STATUS_STYLE[row.status] ?? ""}>
                      {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">{row.location}</td>
                  <td className="py-3 pr-4 text-right">
                    {row.href ? (
                      <Link href={row.href}>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
