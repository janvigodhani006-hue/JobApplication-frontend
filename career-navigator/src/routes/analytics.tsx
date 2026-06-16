import { createFileRoute } from "@tanstack/react-router";
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
import { TrendingUp, Target, Zap, Award } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { monthlyTrend, sourceBreakdown, statusBreakdown } from "@/lib/mock-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · CareerPilot" },
      { name: "description", content: "Understand your job search performance with deep analytics." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AppShell title="Analytics" subtitle="Patterns, conversion rates, and career insights from your job search.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Response Rate" value="32%" trend="+4%" accent="primary" />
        <StatCard label="Avg. Time to Reply" value="6.2d" />
        <StatCard label="Interview→Offer" value="50%" accent="success" />
        <StatCard label="Best Source" value="Referral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <section className="lg:col-span-8 bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-medium">Apps vs. Interviews</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly conversion</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <TrendingUp className="size-3.5" /> Trending up
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
                <Bar dataKey="interviews" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-4 bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
          <h3 className="text-sm font-medium mb-1">Status Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">All applications</p>
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

        <section className="lg:col-span-5 bg-card rounded-xl ring-1 ring-border p-5 sm:p-6">
          <h3 className="text-sm font-medium mb-1">Velocity</h3>
          <p className="text-xs text-muted-foreground mb-4">Applications per week</p>
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
            title="Referrals convert 3.2x better"
            body="Your referral applications interview at 48% vs 15% for cold applies. Lean on your network."
          />
          <Insight
            icon={<Award className="size-4 text-primary" />}
            title="Tuesday is your power day"
            body="Apps sent on Tuesdays get the fastest replies — about 4.1 days on average."
          />
          <Insight
            icon={<TrendingUp className="size-4 text-primary" />}
            title="Frontend roles outperform"
            body="Your callback rate for frontend roles (38%) beats backend (21%). Consider focusing here."
          />
        </div>
      </section>
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
