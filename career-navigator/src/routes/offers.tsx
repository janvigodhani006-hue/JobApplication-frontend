import { createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CompanyLogo } from "@/components/CompanyLogo";
import { offers } from "@/lib/mock-data";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers · CareerPilot" },
      { name: "description", content: "Compare offers side by side and decide with confidence." },
    ],
  }),
  component: OffersPage,
});

const rows = [
  { key: "base", label: "Base Salary", format: (v: number) => `$${v.toLocaleString()}` },
  { key: "bonus", label: "Sign-on Bonus", format: (v: number) => (v ? `$${v.toLocaleString()}` : "—") },
  { key: "equity", label: "Equity", format: (v: string) => v },
  { key: "location", label: "Location", format: (v: string) => v },
  { key: "deadline", label: "Decision by", format: (v: string) => v },
] as const;

function OffersPage() {
  const best = offers.reduce((a, b) => (a.match >= b.match ? a : b));

  return (
    <AppShell
      title="Offer Comparison"
      subtitle={`${offers.length} active offers on the table — let's see which one fits.`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {offers.map((o) => {
          const isBest = o.id === best.id;
          return (
            <article
              key={o.id}
              className={`relative bg-card rounded-xl ring-1 p-6 ${
                isBest ? "ring-primary/40 shadow-[var(--shadow-glow)]" : "ring-border"
              }`}
            >
              {isBest && (
                <div className="absolute -top-2.5 left-6 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-primary text-primary-foreground font-semibold">
                  <Sparkles className="size-3" /> Best Match
                </div>
              )}
              <div className="flex items-start gap-3 mb-5">
                <CompanyLogo company={o.company} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold truncate">{o.company}</h3>
                  <p className="text-sm text-muted-foreground truncate">{o.role}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold tabular-nums text-primary">{o.match}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">match</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-accent/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Base</div>
                  <div className="text-lg font-semibold tabular-nums mt-0.5">
                    ${o.base.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg bg-accent/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Equity</div>
                  <div className="text-lg font-semibold mt-0.5">{o.equity}</div>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button className="flex-1 text-xs font-medium py-2 rounded-md bg-primary text-primary-foreground hover:brightness-110 transition-all inline-flex items-center justify-center gap-1.5">
                  <Check className="size-3.5" /> Accept
                </button>
                <button className="flex-1 text-xs font-medium py-2 rounded-md border border-border hover:bg-accent transition-colors">
                  Negotiate
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="bg-card rounded-xl ring-1 ring-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium">Side-by-side breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-normal">Detail</th>
                {offers.map((o) => (
                  <th key={o.id} className="px-5 py-3 font-normal">{o.company}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-5 py-3 text-muted-foreground">{row.label}</td>
                  {offers.map((o) => (
                    <td key={o.id} className="px-5 py-3 font-medium tabular-nums">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(row.format as any)((o as any)[row.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
