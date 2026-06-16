import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, Download, MapPin } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CompanyLogo, statusBadgeClass } from "@/components/CompanyLogo";
import { applications, statusLabels, type AppStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications · CareerPilot" },
      { name: "description", content: "Every role you've applied to, in one searchable list." },
    ],
  }),
  component: ApplicationsPage,
});

const filters: Array<AppStatus | "all"> = ["all", "applied", "interview", "offer", "rejected", "archived"];

function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AppStatus | "all">("all");

  const rows = useMemo(() => {
    return applications.filter((a) => {
      const matchesFilter = filter === "all" || a.status === filter;
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        a.company.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  return (
    <AppShell
      title="Applications"
      subtitle={`${applications.length} total · search, filter, and export your full pipeline.`}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role, location…"
            className="w-full bg-card border border-border rounded-md pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border bg-card hover:bg-accent">
            <Filter className="size-4" /> Filter
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border bg-card hover:bg-accent">
            <Download className="size-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
        {filters.map((f) => {
          const active = filter === f;
          const count = f === "all" ? applications.length : applications.filter((a) => a.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                active
                  ? "bg-accent text-foreground border-border ring-1 ring-primary/40"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : statusLabels[f]} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-xl ring-1 ring-border overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <span>Company</span>
          <span>Role</span>
          <span>Status</span>
          <span>Location</span>
          <span>Source</span>
          <span>Applied</span>
        </div>
        <div className="divide-y divide-border">
          {rows.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No applications match your filters.
            </div>
          )}
          {rows.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CompanyLogo company={a.company} color={a.logoColor} size="sm" />
                <span className="text-sm font-medium truncate">{a.company}</span>
              </div>
              <div className="text-sm truncate">{a.role}</div>
              <div>
                <span className={`text-[11px] px-2 py-1 rounded-full ${statusBadgeClass(a.status)}`}>
                  {statusLabels[a.status]}
                </span>
              </div>
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="size-3" /> {a.location}
              </div>
              <div className="text-xs text-muted-foreground">{a.source}</div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">{a.appliedDate}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
