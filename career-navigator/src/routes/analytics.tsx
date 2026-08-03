import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Target, Zap, Award, Loader2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { useApplications } from "@/hooks/useApplications";
import type { AppStatus } from "@/lib/api";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · CareerPilot" },
      { name: "description", content: "Understand your job search performance with deep analytics." },
    ],
  }),
  component: AnalyticsPage,
});

// ── Colour palette for pie slices ─────────────────────────────
const STATUS_COLORS: Record<AppStatus, string> = {
  applied:   "var(--color-chart-2)",
  interview: "var(--color-chart-1)",
  offer:     "var(--color-chart-3)",
  rejected:  "var(--color-chart-5)",
  archived:  "var(--color-muted-foreground)",
};

const STATUS_LABELS: Record<AppStatus, string> = {
  applied:   "Applied",
  interview: "Interview",
  offer:     "Offer",
  rejected:  "Rejected",
  archived:  "Archived",
};

function AnalyticsPage() {
  const { apps, total, isLoading } = useApplications();

  // ── Derived data ─────────────────────────────────────────

  /** Monthly trend: group by applied month */
  const monthlyTrend = useMemo(() => {
    const buckets: Record<string, { month: string; applications: number; interviews: number }> = {};
    for (const app of apps) {
      const d = new Date(app.appliedDate);
      if (isNaN(d.getTime())) continue;
      const key   = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const label = d.toLocaleDateString("en-US", { month: "short" });
      if (!buckets[key]) buckets[key] = { month: label, applications: 0, interviews: 0 };
      buckets[key].applications += 1;
      if (app.status === "interview" || app.status === "offer") buckets[key].interviews += 1;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7)
      .map(([, v]) => v);
  }, [apps]);

  /** Status breakdown for pie chart */
  const statusBreakdown = useMemo(() => {
    const counts: Partial<Record<AppStatus, number>> = {};
    for (const app of apps) {
      const s = app.status as AppStatus;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return (Object.keys(STATUS_LABELS) as AppStatus[])
      .filter((s) => (counts[s] ?? 0) > 0)
      .map((s) => ({ name: STATUS_LABELS[s], value: counts[s]!, color: STATUS_COLORS[s] }));
  }, [apps]);

  /** Source breakdown bar chart */
  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of apps) {
      if (app.source) counts[app.source] = (counts[app.source] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([source, count]) => ({ source, count }));
  }, [apps]);

  /** Top-level KPIs */
  const kpis = useMemo(() => {
    const interviews = apps.filter((a) => a.status === "interview" || a.status === "offer").length;
    const offers     = apps.filter((a) => a.status === "offer").length;
    const responseRate = total > 0 ? +((interviews / total) * 100).toFixed(1) : 0;
    const offerRate    = interviews > 0 ? +((offers / interviews) * 100).toFixed(1) : 0;
    const bestSource   = sourceBreakdown[0]?.source ?? "—";
    return { responseRate, offerRate, bestSource };
  }, [apps, total, sourceBreakdown]);

  if (isLoading) {
    return (
      <AppShell title="Analytics" subtitle="Patterns, conversion rates, and career insights from your job search.">
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading analytics…
        </div>
      </AppShell>
    );
  }

  const hasData = apps.length > 0;

  return (
    <AppShell title="Analytics" subtitle="Patterns, conversion rates, and career insights from your job search.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Response Rate"    value={`${kpis.responseRate}%`} accent="primary" />
        <StatCard label="Total Apps"       value={total} />
        <StatCard label="Interview→Offer"  value={`${kpis.offerRate}%`}   accent="success" />
        <StatCard label="Best Source"      value={kpis.bestSource} />
      </div>

      {!hasData && (
        <div className="py-20 text-center text-sm text-muted-foreground">
          No applications yet — add some to see your analytics!
        </div>
      )}

      {hasData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
            {/* Monthly trend bar chart */}
            <section className="lg:col-span-8 bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-medium">Apps vs. Interviews</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Monthly conversion (real data)</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <TrendingUp className="size-3.5" /> Live
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                    <Bar dataKey="applications" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="interviews"   fill="var(--color-primary)"  radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Status pie chart */}
            <section className="lg:col-span-4 bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
              <h3 className="text-sm font-medium mb-1">Status Breakdown</h3>
              <p className="text-xs text-muted-foreground mb-4">All {total} applications</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {statusBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="var(--color-background)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {statusBreakdown.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="size-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted-foreground flex-1">{s.name}</span>
                    <span className="tabular-nums font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
            {/* Source breakdown */}
            <section className="lg:col-span-7 bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
              <h3 className="text-sm font-medium mb-1">Top Sources</h3>
              <p className="text-xs text-muted-foreground mb-4">Where your applications come from</p>
              <div className="space-y-3">
                {sourceBreakdown.map((s) => {
                  const max = Math.max(...sourceBreakdown.map((x) => x.count));
                  const pct = (s.count / max) * 100;
                  return (
                    <div key={s.source}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span>{s.source}</span>
                        <span className="text-muted-foreground tabular-nums">{s.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-accent overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Velocity line chart */}
            <section className="lg:col-span-5 bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
              <h3 className="text-sm font-medium mb-1">Velocity</h3>
              <p className="text-xs text-muted-foreground mb-4">Applications per month</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
                    <Line
                      type="monotone"
                      dataKey="applications"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-primary)", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
            <h3 className="text-sm font-medium mb-4 inline-flex items-center gap-2">
              <Zap className="size-4 text-primary" /> Smart Career Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Insight
                icon={<Target className="size-4 text-primary" />}
                title="Track your top source"
                body={`${kpis.bestSource} is currently your most-used application source. Keep leveraging it.`}
              />
              <Insight
                icon={<Award className="size-4 text-primary" />}
                title="Interview conversion"
                body={`${kpis.responseRate}% of your applications led to interviews or offers. Aim for consistent improvement.`}
              />
              <Insight
                icon={<TrendingUp className="size-4 text-primary" />}
                title="Keep the momentum"
                body={`You have ${apps.filter((a) => a.status === "interview").length} active interviews. Follow up promptly to stay top of mind.`}
              />
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function Insight({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="p-4 rounded-lg bg-accent/40 ring-1 ring-border">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
