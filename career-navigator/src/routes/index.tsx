import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ArrowUpRight, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { CompanyLogo, statusBadgeClass } from "@/components/CompanyLogo";
import { statusLabels, type AppStatus } from "@/lib/api";
import { useApplications } from "@/hooks/useApplications";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useInterviews } from "@/hooks/useInterviews";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useActivities } from "@/hooks/useActivities";
import { Video, Calendar } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · CareerPilot" },
      {
        name: "description",
        content:
          "Your job search at a glance — application stats, upcoming interviews, recent activity, and pipeline preview.",
      },
    ],
  }),
  component: Dashboard,
});

// ─────────────────────────────────────────────────────────────
/** Format an ISO timestamp as a short relative time label */
function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 60) return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1d ago";
  return `${diffDays}d ago`;
}

// ─────────────────────────────────────────────────────────────
function Dashboard() {
  const { firstName, isLoading: userLoading } = useCurrentUser();
  // useApplications is still needed for Pipeline Preview
  const { apps, isLoading: appsLoading } = useApplications();
  const { upcoming: upcomingInterviews, isLoading: interviewsLoading } = useInterviews();
  // Pre-aggregated stats from the dedicated dashboard endpoint
  const { stats, isLoading: statsLoading } = useDashboardStats();
  // Real activity feed from /api/activities
  const { activities, isLoading: activitiesLoading } = useActivities();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const displayName = userLoading ? "…" : (firstName || "there");

  // ── Pipeline preview (applied/interview/offer/rejected) ───
  // Still derived from the full app list (needs per-app data)
  const pipelineGroups = useMemo(
    () =>
      (["applied", "interview", "offer", "rejected"] as const).map((s) => ({
        status: s,
        items: apps.filter((a) => a.status === s),
      })),
    [apps],
  );

  // ── Monthly trend chart — from /api/dashboard/stats ──────
  // Backend returns { month, count, interviews };
  // rename `count` → `applications` for the Recharts dataKey
  const monthlyTrend = useMemo(
    () => stats.monthlyTrends.map((t) => ({ month: t.month, applications: t.count, interviews: t.interviews })),
    [stats.monthlyTrends],
  );

  // ── Recent activity feed (derived from apps) ─────────────
  // Removed: was buildActivity(apps) — now comes from useActivities()

  const isLoading = userLoading || appsLoading || interviewsLoading || statsLoading || activitiesLoading;

  return (
    <AppShell
      title={`${greeting}, ${displayName}.`}
      subtitle="Your job search dashboard — stats, pipeline, and activity all from your live data."
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your data…
        </div>
      )}

      {!isLoading && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <StatCard label="Total Apps"   value={stats.totalApps} />
            <StatCard label="Active"       value={stats.activeApps} />
            <StatCard label="Interviews"   value={stats.interviewsCount} accent="primary" />
            <StatCard label="Offers"       value={stats.offersCount}     accent="success" />
            <StatCard label="Rejections"   value={stats.rejectionsCount} />
            <StatCard label="Success Rate" value={`${stats.successRate}%`} accent="success" />
          </div>

          {/* Trend + Upcoming placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
            <section className="lg:col-span-8 bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-medium">Monthly Application Trend</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Based on your actual applied dates</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <TrendingUp className="size-3.5" />
                  Live data
                </div>
              </div>
              <div className="h-64">
                {monthlyTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Add applications to see your trend chart.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad-apps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="var(--color-primary)"   stopOpacity={0.5} />
                          <stop offset="100%" stopColor="var(--color-primary)"   stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="grad-int" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="var(--color-chart-2)"   stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--color-chart-2)"   stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Area type="monotone" dataKey="applications" stroke="var(--color-primary)"   strokeWidth={2} fill="url(#grad-apps)" />
                      <Area type="monotone" dataKey="interviews"   stroke="var(--color-chart-2)"   strokeWidth={2} fill="url(#grad-int)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Upcoming scheduled interviews (real data from /api/interviews) */}
            <section className="lg:col-span-4 bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Upcoming Interviews</h3>
                <Link to="/interviews" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  All <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingInterviews.slice(0, 4).map((i) => {
                  const d = new Date(i.interviewDate);
                  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={i.id} className="flex gap-3 min-w-0">
                      <CompanyLogo company={i.company} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{i.company}</p>
                        <p className="text-xs text-muted-foreground truncate">{i.role}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                            <Calendar className="size-2.5" />{dateStr}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                            <Video className="size-2.5" />{i.platform}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 self-start pt-1">{timeStr}</span>
                    </div>
                  );
                })}
                {upcomingInterviews.length === 0 && (
                  <p className="text-xs text-muted-foreground">No upcoming interviews. <Link to="/interviews" className="text-primary hover:underline">Schedule one →</Link></p>
                )}
              </div>
            </section>
          </div>

          {/* Pipeline Preview */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">
                Pipeline Preview
              </h2>
              <Link to="/kanban" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                View Full Kanban <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
              {pipelineGroups.map((col) => (
                <div key={col.status} className="min-w-[280px] space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {statusLabels[col.status as AppStatus]} ({col.items.length})
                    </span>
                  </div>
                  {col.items.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      className={`bg-card p-4 rounded-xl ring-1 ring-border hover:ring-white/20 transition-all cursor-pointer ${
                        a.status === "interview" ? "border-l-2 border-primary" : ""
                      } ${a.status === "rejected" ? "opacity-60" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="text-xs text-muted-foreground truncate">{a.company}</span>
                        {a.tag && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBadgeClass(a.status as AppStatus)}`}>
                            {a.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{a.role}</p>
                      {a.salary && <p className="text-xs text-[oklch(0.85_0.17_162)] mt-2">{a.salary} Base</p>}
                    </div>
                  ))}
                  {col.items.length === 0 && (
                    <div className="bg-card p-4 rounded-xl ring-1 ring-border border-dashed text-center text-xs text-muted-foreground">
                      No applications
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity — live from /api/activities */}
          <section>
            <h2 className="text-sm font-medium mb-4">Recent Activity</h2>
            <div className="bg-card rounded-xl ring-1 ring-border divide-y divide-border">
              {activities.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No activity yet — start adding applications!
                </div>
              )}
              {activities.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-2 rounded-full shrink-0 ${
                        a.type === "interview"
                          ? "bg-primary"
                          : a.type === "offer"
                          ? "bg-[oklch(0.78_0.17_162)]"
                          : a.type === "rejected"
                          ? "bg-[oklch(0.7_0.18_25)]"
                          : "bg-muted-foreground/50"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{a.message}</p>
                      {a.detail && (
                        <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
