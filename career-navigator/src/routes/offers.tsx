import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Sparkles,
  Plus,
  Loader2,
  X,
  AlertCircle,
  HandshakeIcon,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CompanyLogo } from "@/components/CompanyLogo";
import { useOffers, useCreateOffer, useUpdateOfferStatus } from "@/hooks/useOffers";
import { useApplications } from "@/hooks/useApplications";
import type { OfferPayload, OfferStatus } from "@/lib/offer-api";

// ── Route ────────────────────────────────────────────────────
export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers · CareerPilot" },
      { name: "description", content: "Compare offers side by side and decide with confidence." },
    ],
  }),
  component: OffersPage,
});

// ── Helpers ──────────────────────────────────────────────────
function formatDeadline(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

const STATUS_CONFIG: Record<
  OfferStatus,
  { label: string; className: string }
> = {
  pending:     { label: "Pending",     className: "bg-amber-500/10  text-amber-400"  },
  accepted:    { label: "Accepted",    className: "bg-green-500/10  text-green-400"  },
  rejected:    { label: "Declined",    className: "bg-red-500/10    text-red-400"    },
  negotiating: { label: "Negotiating", className: "bg-blue-500/10   text-blue-400"   },
};

// ── Log Offer Modal ───────────────────────────────────────────
interface LogOfferModalProps {
  onClose: () => void;
}

function LogOfferModal({ onClose }: LogOfferModalProps) {
  const { logOffer, isLogging, logError } = useCreateOffer({ onSuccess: onClose });
  const { apps } = useApplications();

  const [form, setForm] = useState<OfferPayload>({
    applicationId: undefined,
    company: "",
    role: "",
    base: 0,
    equity: "",
    bonus: 0,
    location: "",
    deadline: "",
    matchPercentage: 0,
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  function setField<K extends keyof OfferPayload>(key: K, value: OfferPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim()) { setValidationError("Company is required."); return; }
    if (!form.role.trim())    { setValidationError("Role is required."); return; }
    if (!form.location.trim()){ setValidationError("Location is required."); return; }
    if (!form.base || form.base <= 0) { setValidationError("Base salary must be greater than 0."); return; }
    if (!form.deadline)       { setValidationError("Please pick a decision deadline."); return; }
    try {
      const isoDeadline = new Date(form.deadline).toISOString();
      await logOffer({ ...form, deadline: isoDeadline });
    } catch { /* surfaced via logError */ }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card ring-1 ring-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-sm font-semibold">Log Job Offer</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error banner */}
          {(validationError || logError) && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationError ?? logError?.message}
            </div>
          )}

          {/* Link to Application */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Link to Application
              <span className="text-muted-foreground/50 ml-1">(optional — auto-fills company & role)</span>
            </label>
            <select
              id="offer-application-id"
              value={form.applicationId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) { setField("applicationId", undefined); return; }
                const app = apps.find((a) => a.id === id);
                if (app) {
                  setForm((prev) => ({
                    ...prev,
                    applicationId: id,
                    company: app.company,
                    role: app.role,
                  }));
                }
                setValidationError(null);
              }}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            >
              <option value="">— Not linked to an application —</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company} · {a.role}
                </option>
              ))}
            </select>
          </div>

          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Company <span className="text-red-400">*</span>
              </label>
              <input
                id="offer-company"
                type="text"
                placeholder="e.g. Stripe"
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Role <span className="text-red-400">*</span>
              </label>
              <input
                id="offer-role"
                type="text"
                placeholder="e.g. Full Stack Engineer"
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Location <span className="text-red-400">*</span>
            </label>
            <input
              id="offer-location"
              type="text"
              placeholder="e.g. San Francisco, CA"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Base + Bonus */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Base Salary (USD) <span className="text-red-400">*</span>
              </label>
              <input
                id="offer-base"
                type="number"
                min={0}
                placeholder="195000"
                value={form.base || ""}
                onChange={(e) => setField("base", parseFloat(e.target.value) || 0)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Sign-on Bonus (USD)
              </label>
              <input
                id="offer-bonus"
                type="number"
                min={0}
                placeholder="0"
                value={form.bonus || ""}
                onChange={(e) => setField("bonus", parseFloat(e.target.value) || 0)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Equity + Match % */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Equity</label>
              <input
                id="offer-equity"
                type="text"
                placeholder='e.g. "0.05%"'
                value={form.equity}
                onChange={(e) => setField("equity", e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Match %</label>
              <input
                id="offer-match"
                type="number"
                min={0}
                max={100}
                placeholder="92"
                value={form.matchPercentage || ""}
                onChange={(e) => setField("matchPercentage", parseInt(e.target.value) || 0)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Decision Deadline */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Decision Deadline <span className="text-red-400">*</span>
            </label>
            <input
              id="offer-deadline"
              type="date"
              value={form.deadline}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setField("deadline", e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm py-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="offer-submit"
              disabled={isLogging}
              className="flex-1 text-sm py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:brightness-110 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
            >
              {isLogging ? (
                <><Loader2 className="size-3.5 animate-spin" /> Logging…</>
              ) : (
                <><DollarSign className="size-3.5" /> Log Offer</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Comparison table row definitions ─────────────────────────
const TABLE_ROWS = [
  { key: "base",            label: "Base Salary",   fmt: (v: unknown) => formatMoney(v as number) },
  { key: "bonus",           label: "Sign-on Bonus", fmt: (v: unknown) => ((v as number) > 0 ? formatMoney(v as number) : "—") },
  { key: "equity",          label: "Equity",        fmt: (v: unknown) => (v as string) || "—" },
  { key: "location",        label: "Location",      fmt: (v: unknown) => v as string },
  { key: "deadline",        label: "Decision by",   fmt: (v: unknown) => formatDeadline(v as string) },
  { key: "matchPercentage", label: "Match Score",   fmt: (v: unknown) => `${v}%` },
];

// ── Main Page ─────────────────────────────────────────────────
function OffersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { offers, bestOffer, isLoading, isError, error } = useOffers();
  const { setStatus, isSettingStatus } = useUpdateOfferStatus();

  return (
    <AppShell
      title="Offer Comparison"
      subtitle={
        offers.length > 0
          ? `${offers.length} offer${offers.length > 1 ? "s" : ""} on the table — compare and decide with confidence.`
          : "No offers yet — log your first offer to start comparing."
      }
      action={
        <button
          id="log-offer-btn"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
        >
          <Plus className="size-4" /> Log Offer
        </button>
      }
    >
      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading offers…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 mb-6">
          <AlertCircle className="size-4 shrink-0" />
          {error?.message ?? "Failed to load offers."}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && offers.length === 0 && (
        <div className="bg-card rounded-xl ring-1 ring-border p-14 text-center">
          <DollarSign className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium mb-1">No offers logged yet</p>
          <p className="text-xs text-muted-foreground mb-5">
            Record your compensation packages to compare them side by side.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
          >
            <Plus className="size-4" /> Log Your First Offer
          </button>
        </div>
      )}

      {/* Offer Cards */}
      {!isLoading && !isError && offers.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {offers.map((o) => {
              const isBest = o.id === bestOffer?.id;
              const statusCfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.pending;

              return (
                <article
                  key={o.id}
                  className={`relative bg-card rounded-xl ring-1 p-6 transition-all ${
                    isBest ? "ring-primary/40 shadow-[var(--shadow-glow)]" : "ring-border"
                  } ${o.status === "rejected" ? "opacity-60" : ""}`}
                >
                  {/* Best Match badge */}
                  {isBest && o.status !== "rejected" && (
                    <div className="absolute -top-2.5 left-6 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-primary text-primary-foreground font-semibold">
                      <Sparkles className="size-3" /> Best Match
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start gap-3 mb-5">
                    <CompanyLogo company={o.company} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold truncate">{o.company}</h3>
                      <p className="text-sm text-muted-foreground truncate">{o.role}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{o.location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-semibold tabular-nums text-primary">
                        {o.matchPercentage}%
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">match</div>
                    </div>
                  </div>

                  {/* Compensation highlights */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-accent/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Base</div>
                      <div className="text-lg font-semibold tabular-nums mt-0.5">
                        {formatMoney(o.base)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-accent/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Equity</div>
                      <div className="text-lg font-semibold mt-0.5">{o.equity || "—"}</div>
                    </div>
                  </div>

                  {/* Deadline + Status */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      Decide by {formatDeadline(o.deadline)}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-medium ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {o.status === "pending" || o.status === "negotiating" ? (
                    <div className="flex gap-2">
                      <button
                        id={`accept-offer-${o.id}`}
                        onClick={() => setStatus({ id: o.id, status: "accepted" })}
                        disabled={isSettingStatus}
                        className="flex-1 text-xs font-medium py-2 rounded-md bg-primary text-primary-foreground hover:brightness-110 transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="size-3.5" /> Accept
                      </button>
                      <button
                        id={`negotiate-offer-${o.id}`}
                        onClick={() => setStatus({ id: o.id, status: "negotiating" })}
                        disabled={isSettingStatus}
                        className="flex-1 text-xs font-medium py-2 rounded-md border border-border hover:bg-accent transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <HandshakeIcon className="size-3.5" /> Negotiate
                      </button>
                      <button
                        id={`decline-offer-${o.id}`}
                        onClick={() => setStatus({ id: o.id, status: "rejected" })}
                        disabled={isSettingStatus}
                        className="p-2 rounded-md border border-border text-muted-foreground hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                        title="Decline offer"
                      >
                        <XCircle className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className={`text-center text-xs font-medium py-2 rounded-md ${statusCfg.className}`}>
                      {o.status === "accepted" ? "🎉 Offer Accepted" : "Offer Declined"}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Side-by-side comparison table */}
          {offers.length > 1 && (
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
                        <th key={o.id} className="px-5 py-3 font-normal">
                          {o.company}
                          {o.id === bestOffer?.id && (
                            <span className="ml-1.5 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                              Best
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {TABLE_ROWS.map((row) => (
                      <tr key={row.key}>
                        <td className="px-5 py-3 text-muted-foreground">{row.label}</td>
                        {offers.map((o) => (
                          <td key={o.id} className="px-5 py-3 font-medium tabular-nums">
                            {row.fmt((o as unknown as Record<string, unknown>)[row.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Log Offer Modal */}
      {modalOpen && <LogOfferModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}
