import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  MapPin,
  Plus,
  X,
  Loader2,
  Trash2,
  Pencil,
  ExternalLink,
  DollarSign,
  Tag,
  Calendar,
  Building2,
  Briefcase,
  Globe,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CompanyLogo, statusBadgeClass } from "@/components/CompanyLogo";
import { statusLabels, type AppStatus } from "@/lib/api";
import {
  useApplications,
  useApplicationById,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
} from "@/hooks/useApplications";
import type { ApplicationPayload, ApplicationResponse } from "@/lib/api";

export const Route = createFileRoute("/applications")({
  // Declare the `new` search param — used by the Dashboard's
  // "New Application" button to auto-open the create modal.
  validateSearch: (search: Record<string, unknown>) => ({
    new: search.new === "true" ? "true" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Applications · CareerPilot" },
      {
        name: "description",
        content: "Every role you've applied to, in one searchable list.",
      },
    ],
  }),
  component: ApplicationsPage,
});

const STATUS_FILTERS: Array<AppStatus | "all"> = [
  "all",
  "applied",
  "interview",
  "offer",
  "rejected",
  "archived",
];

const STATUS_OPTIONS: AppStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
  "archived",
];
const SOURCE_OPTIONS = ["LinkedIn", "Referral", "Company site"] as const;

// ─────────────────────────────────────────────────────────────
// Default form values
// ─────────────────────────────────────────────────────────────
function emptyForm(): ApplicationPayload {
  return {
    company: "",
    role: "",
    status: "applied",
    location: "",
    appliedDate: new Date().toISOString().slice(0, 16),
    source: "LinkedIn",
    salary: "",
    tag: "",
    logoColor: "#ededed",
  };
}

function appToPayload(app: ApplicationResponse): ApplicationPayload {
  return {
    company: app.company,
    role: app.role,
    status: app.status,
    location: app.location,
    // convert ISO back to datetime-local format
    appliedDate: app.appliedDate
      ? new Date(app.appliedDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    source: app.source,
    salary: app.salary ?? "",
    tag: app.tag ?? "",
    logoColor: app.logoColor ?? "#ededed",
  };
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AppStatus | "all">("all");

  // Modal / Drawer state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drawerAppId, setDrawerAppId] = useState<string | null>(null);
  const [editingApp, setEditingApp] = useState<ApplicationResponse | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-open create modal when navigated with ?new=true
  // (e.g. from the Dashboard "New Application" button)
  const search = useSearch({ from: "/applications" });
  useEffect(() => {
    if (search.new === "true") {
      setShowCreateModal(true);
    }
  }, [search.new]);

  // ── Data from backend ──────────────────────────────────────
  const { apps, isLoading, isError } = useApplications();
  const { removeApp, isRemoving } = useDeleteApplication({
    onSuccess: () => {
      setDeleteConfirmId(null);
      setDrawerAppId(null); // close drawer if open
    },
  });

  // ── Filter / search (client-side) ─────────────────────────
  const rows = useMemo(() => {
    return apps.filter((a) => {
      const matchesFilter = filter === "all" || a.status === filter;
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        a.company.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [apps, query, filter]);

  function formatDate(iso: string) {
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

  return (
    <AppShell
      title="Applications"
      subtitle={`${apps.length} total · search, filter, and manage your full pipeline.`}
      action={
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-primary-foreground text-sm font-medium px-3.5 py-2 rounded-md inline-flex items-center gap-1.5 hover:brightness-110 transition-all shadow-[var(--shadow-glow)]"
          id="new-application-btn"
        >
          <Plus className="size-4" />
          New Application
        </button>
      }
    >
      {/* ── Search + Filter bar ─────────────────────────────── */}
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

      {/* ── Status pills ────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
        {STATUS_FILTERS.map((f) => {
          const active = filter === f;
          const count =
            f === "all"
              ? apps.length
              : apps.filter((a) => a.status === f).length;
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
              {f === "all" ? "All" : statusLabels[f as AppStatus]}{" "}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="bg-card rounded-xl ring-1 ring-border overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <span>Company</span>
          <span>Role</span>
          <span>Status</span>
          <span>Location</span>
          <span>Source</span>
          <span>Applied</span>
          <span />
        </div>

        <div className="divide-y divide-border">
          {/* Loading state */}
          {isLoading && (
            <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading applications…
            </div>
          )}

          {/* Error state */}
          {isError && !isLoading && (
            <div className="p-12 text-center text-sm text-destructive">
              Failed to load applications. Is the backend running?
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && rows.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              {apps.length === 0
                ? "No applications yet — click \"New Application\" to add your first one."
                : "No applications match your filters."}
            </div>
          )}

          {/* Rows — click opens detail drawer */}
          {rows.map((a) => (
            <div
              key={a.id}
              onClick={() => setDrawerAppId(a.id)}
              className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-accent/30 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CompanyLogo company={a.company} color={a.logoColor} size="sm" />
                <span className="text-sm font-medium truncate">{a.company}</span>
              </div>
              <div className="text-sm truncate">{a.role}</div>
              <div>
                <span
                  className={`text-[11px] px-2 py-1 rounded-full ${statusBadgeClass(a.status as AppStatus)}`}
                >
                  {statusLabels[a.status as AppStatus] ?? a.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="size-3" /> {a.location}
              </div>
              <div className="text-xs text-muted-foreground">{a.source}</div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(a.appliedDate)}
              </div>
              {/* Row actions */}
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()} // don't open drawer on action buttons
              >
                <button
                  onClick={() => {
                    setEditingApp(a);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
                  title="Edit application"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(a.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Delete application"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detail Drawer (GET /api/applications/:id) ────────── */}
      {drawerAppId && (
        <DetailDrawer
          id={drawerAppId}
          onClose={() => setDrawerAppId(null)}
          onEdit={(app) => setEditingApp(app)}
          onDelete={(id) => setDeleteConfirmId(id)}
        />
      )}

      {/* ── Create Modal ─────────────────────────────────────── */}
      {showCreateModal && (
        <ApplicationFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* ── Edit Modal (PUT /api/applications/:id) ────────────── */}
      {editingApp && (
        <ApplicationFormModal
          mode="edit"
          initial={editingApp}
          onClose={() => setEditingApp(null)}
        />
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl ring-1 ring-border p-6 max-w-sm w-full space-y-4 animate-slide-up">
            <h3 className="font-semibold text-base">Delete Application?</h3>
            <p className="text-sm text-muted-foreground">
              This will permanently remove the application from your pipeline and the database.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm rounded-md border border-border bg-card hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => removeApp(deleteConfirmId)}
                disabled={isRemoving}
                className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isRemoving && <Loader2 className="size-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Detail Drawer — GET /api/applications/:id
// Slide-over panel shown when a row is clicked.
// ─────────────────────────────────────────────────────────────
function DetailDrawer({
  id,
  onClose,
  onEdit,
  onDelete,
}: {
  id: string;
  onClose: () => void;
  onEdit: (app: ApplicationResponse) => void;
  onDelete: (id: string) => void;
}) {
  // Fetch fresh data from GET /api/applications/:id
  const { app, isLoading, isError } = useApplicationById(id);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card ring-1 ring-border shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="font-semibold text-base">Application Details</h2>
          <div className="flex items-center gap-2">
            {app && (
              <>
                <button
                  onClick={() => { onEdit(app); onClose(); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                  id="edit-application-btn"
                >
                  <Pencil className="size-3" /> Edit
                </button>
                <button
                  onClick={() => { onDelete(app.id); onClose(); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium"
                  id="delete-application-btn"
                >
                  <Trash2 className="size-3" /> Delete
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="size-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading details…
            </div>
          )}

          {isError && (
            <div className="py-16 text-center text-sm text-destructive">
              Failed to load application. Is the backend running?
            </div>
          )}

          {app && !isLoading && (
            <>
              {/* Company + Role hero */}
              <div className="flex items-start gap-4">
                <div
                  className="size-14 rounded-xl shrink-0 grid place-items-center text-xl font-bold ring-1 ring-white/10"
                  style={{
                    background: app.logoColor ?? "var(--color-accent)",
                    color:
                      app.logoColor === "#ffffff" || app.logoColor === "#ededed"
                        ? "#000"
                        : "#fff",
                  }}
                >
                  {app.company.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-tight">{app.role}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{app.company}</p>
                  <span
                    className={`inline-block mt-2 text-[11px] px-2.5 py-1 rounded-full ${statusBadgeClass(app.status as AppStatus)}`}
                  >
                    {statusLabels[app.status as AppStatus] ?? app.status}
                  </span>
                </div>
              </div>

              {/* Details grid */}
              <div className="space-y-3">
                <DetailRow
                  icon={<MapPin className="size-3.5 text-muted-foreground" />}
                  label="Location"
                  value={app.location}
                />
                <DetailRow
                  icon={<Globe className="size-3.5 text-muted-foreground" />}
                  label="Source"
                  value={app.source}
                />
                <DetailRow
                  icon={<Calendar className="size-3.5 text-muted-foreground" />}
                  label="Applied On"
                  value={formatDate(app.appliedDate)}
                />
                {app.salary && (
                  <DetailRow
                    icon={<DollarSign className="size-3.5 text-muted-foreground" />}
                    label="Salary"
                    value={app.salary}
                  />
                )}
                {app.tag && (
                  <DetailRow
                    icon={<Tag className="size-3.5 text-muted-foreground" />}
                    label="Tag"
                    value={app.tag}
                  />
                )}
                <DetailRow
                  icon={<Building2 className="size-3.5 text-muted-foreground" />}
                  label="Application ID"
                  value={
                    <span className="font-mono text-[10px] text-muted-foreground break-all">
                      {app.id}
                    </span>
                  }
                />
                <DetailRow
                  icon={<Briefcase className="size-3.5 text-muted-foreground" />}
                  label="Created At"
                  value={formatDate(app.createdAt)}
                />
              </div>

              {/* Quick status info */}
              <div className="bg-accent/40 rounded-lg p-4 ring-1 ring-border">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                  Current Status
                </p>
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${
                    app.status === "offer" ? "bg-[oklch(0.78_0.17_162)]" :
                    app.status === "interview" ? "bg-primary" :
                    app.status === "rejected" ? "bg-[oklch(0.7_0.18_25)]" :
                    "bg-muted-foreground/50"
                  }`} />
                  <span className="text-sm font-medium">
                    {statusLabels[app.status as AppStatus] ?? app.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  To change status, drag the card on the Kanban board or use the Edit button above.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {app && (
          <div className="p-5 border-t border-border shrink-0">
            <button
              onClick={() => { onEdit(app); onClose(); }}
              className="w-full py-2.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:brightness-110 transition-all inline-flex items-center justify-center gap-2 shadow-[var(--shadow-glow)]"
              id="drawer-edit-btn"
            >
              <ExternalLink className="size-4" />
              Open Edit Form
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Small helper row for the detail drawer
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-sm flex-1">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Application Form Modal
// mode="create" → POST /api/applications
// mode="edit"   → PUT  /api/applications/:id
// ─────────────────────────────────────────────────────────────
function ApplicationFormModal({
  mode,
  initial,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: ApplicationResponse;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ApplicationPayload>(
    initial ? appToPayload(initial) : emptyForm()
  );
  const [formError, setFormError] = useState("");

  // CREATE hook
  const { createApp, isCreating } = useCreateApplication({
    onSuccess: () => onClose(),
    onError: (err) => setFormError(err.message),
  });

  // UPDATE hook — PUT /api/applications/:id
  const { updateApp, isUpdating } = useUpdateApplication({
    onSuccess: () => onClose(),
    onError: (err) => setFormError(err.message),
  });

  const isSaving = isCreating || isUpdating;

  function set<K extends keyof ApplicationPayload>(key: K, value: ApplicationPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.company.trim()) return setFormError("Company name is required.");
    if (!form.role.trim()) return setFormError("Role / position is required.");
    if (!form.location.trim()) return setFormError("Location is required.");
    if (!form.appliedDate) return setFormError("Applied date is required.");

    const payload: ApplicationPayload = {
      ...form,
      appliedDate: new Date(form.appliedDate).toISOString(),
      salary: form.salary?.trim() || undefined,
      tag: form.tag?.trim() || undefined,
      logoColor: form.logoColor || "#ededed",
    };

    if (mode === "create") {
      await createApp(payload);
    } else if (initial) {
      // PUT /api/applications/:id
      await updateApp({ id: initial.id, payload });
    }
  }

  const title = mode === "create" ? "New Application" : "Edit Application";
  const subtitle =
    mode === "create"
      ? "Saved directly to your database via POST /api/applications"
      : `Updating via PUT /api/applications/${initial?.id?.slice(0, 8)}…`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl ring-1 ring-border w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-semibold text-base">{title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Company *">
              <input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="e.g. Google"
                className={inputCls}
                required
              />
            </FormField>
            <FormField label="Role / Position *">
              <input
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="e.g. Frontend Engineer"
                className={inputCls}
                required
              />
            </FormField>
          </div>

          {/* Status + Source */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Status *">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={inputCls}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Source *">
              <select
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                className={inputCls}
              >
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Location */}
          <FormField label="Location *">
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. San Francisco, CA (Hybrid)"
              className={inputCls}
              required
            />
          </FormField>

          {/* Applied date + Salary */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Applied Date *">
              <input
                type="datetime-local"
                value={form.appliedDate}
                onChange={(e) => set("appliedDate", e.target.value)}
                className={inputCls}
                required
              />
            </FormField>
            <FormField label="Salary (optional)">
              <input
                value={form.salary ?? ""}
                onChange={(e) => set("salary", e.target.value)}
                placeholder="e.g. $120,000–$150,000"
                className={inputCls}
              />
            </FormField>
          </div>

          {/* Tag + Logo colour */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tag (optional)">
              <input
                value={form.tag ?? ""}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="e.g. High Priority"
                className={inputCls}
              />
            </FormField>
            <FormField label="Logo Color (optional)">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.logoColor ?? "#ededed"}
                  onChange={(e) => set("logoColor", e.target.value)}
                  className="h-9 w-12 rounded-md border border-border bg-card cursor-pointer p-1"
                />
                <input
                  value={form.logoColor ?? "#ededed"}
                  onChange={(e) => set("logoColor", e.target.value)}
                  placeholder="#ededed"
                  className={`${inputCls} flex-1`}
                />
              </div>
            </FormField>
          </div>

          {/* Error */}
          {formError && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {formError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-border bg-card hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-2 shadow-[var(--shadow-glow)]"
              id={mode === "create" ? "submit-new-application" : "submit-edit-application"}
            >
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              {isSaving
                ? mode === "create"
                  ? "Saving to DB…"
                  : "Updating…"
                : mode === "create"
                  ? "Save Application"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────
const inputCls =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
