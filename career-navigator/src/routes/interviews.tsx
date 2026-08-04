import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Video,
  Calendar,
  Clock,
  Plus,
  Loader2,
  CheckCircle2,
  Circle,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CompanyLogo } from "@/components/CompanyLogo";
import {
  useInterviews,
  useCreateInterview,
  useMarkInterviewComplete,
  useDeleteInterview,
} from "@/hooks/useInterviews";
import type { InterviewPayload, InterviewType, InterviewPlatform } from "@/lib/interview-api";

// ── Constants ────────────────────────────────────────────────
const INTERVIEW_TYPES: InterviewType[] = [
  "Technical Screen",
  "Behavioral",
  "Final Round",
];
const PLATFORMS: InterviewPlatform[] = ["Zoom", "Google Meet", "On-site"];

const typeColors: Record<InterviewType, string> = {
  "Technical Screen": "bg-blue-500/10 text-blue-400",
  Behavioral: "bg-violet-500/10 text-violet-400",
  "Final Round": "bg-amber-500/10 text-amber-400",
};

// ── Route ────────────────────────────────────────────────────
export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Interviews · CareerPilot" },
      {
        name: "description",
        content: "All your upcoming interviews scheduled in one place.",
      },
    ],
  }),
  component: InterviewsPage,
});

// ── Helpers ──────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ onSchedule }: { onSchedule: () => void }) {
  return (
    <div className="col-span-full bg-card rounded-xl ring-1 ring-border p-12 text-center">
      <Calendar className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-sm font-medium mb-1">No upcoming interviews</p>
      <p className="text-xs text-muted-foreground mb-5">
        Schedule your first interview round to track it here.
      </p>
      <button
        onClick={onSchedule}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
      >
        <Plus className="size-4" /> Schedule Interview
      </button>
    </div>
  );
}

// ── Schedule Modal ────────────────────────────────────────────
interface ScheduleModalProps {
  onClose: () => void;
}

function ScheduleModal({ onClose }: ScheduleModalProps) {
  const { schedule, isScheduling, scheduleError } = useCreateInterview({
    onSuccess: () => onClose(),
  });

  const [form, setForm] = useState<InterviewPayload>({
    company: "",
    role: "",
    type: "Technical Screen",
    interviewDate: "",
    platform: "Google Meet",
    prepNotes: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  function set<K extends keyof InterviewPayload>(key: K, value: InterviewPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company || !form.role || !form.interviewDate) {
      setValidationError("Company, role, and date are required.");
      return;
    }
    try {
      // Convert local datetime to ISO-8601 UTC
      const isoDate = new Date(form.interviewDate).toISOString();
      await schedule({ ...form, interviewDate: isoDate });
    } catch {
      // error surfaced via scheduleError
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card ring-1 ring-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Schedule Interview</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error */}
          {(validationError || scheduleError) && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationError ?? scheduleError?.message}
            </div>
          )}

          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Company <span className="text-red-400">*</span>
              </label>
              <input
                id="interview-company"
                type="text"
                placeholder="e.g. Google"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Role <span className="text-red-400">*</span>
              </label>
              <input
                id="interview-role"
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>
          </div>

          {/* Type + Platform */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Interview Type <span className="text-red-400">*</span>
              </label>
              <select
                id="interview-type"
                value={form.type}
                onChange={(e) => set("type", e.target.value as InterviewType)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              >
                {INTERVIEW_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Platform <span className="text-red-400">*</span>
              </label>
              <select
                id="interview-platform"
                value={form.platform}
                onChange={(e) => set("platform", e.target.value as InterviewPlatform)}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date / Time */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Date & Time <span className="text-red-400">*</span>
            </label>
            <input
              id="interview-date"
              type="datetime-local"
              value={form.interviewDate}
              onChange={(e) => set("interviewDate", e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>

          {/* Prep Notes */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Prep Notes <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <textarea
              id="interview-prep-notes"
              rows={3}
              placeholder="Review System Design & Data Structures..."
              value={form.prepNotes}
              onChange={(e) => set("prepNotes", e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
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
              disabled={isScheduling}
              id="interview-submit"
              className="flex-1 text-sm py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:brightness-110 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Scheduling…
                </>
              ) : (
                "Schedule Interview"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
function InterviewsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { upcoming, past, isLoading, isError, error } = useInterviews();
  const { complete, isCompleting } = useMarkInterviewComplete();
  const { removeInterview, isRemoving } = useDeleteInterview();

  return (
    <AppShell
      title="Interviews"
      subtitle="Upcoming rounds across companies — schedule, prep notes, and platform links."
      action={
        <button
          id="schedule-interview-btn"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
        >
          <Plus className="size-4" /> Schedule Interview
        </button>
      }
    >
      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading interviews…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          {error?.message ?? "Failed to load interviews."}
        </div>
      )}

      {/* Upcoming Interviews */}
      {!isLoading && !isError && (
        <>
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Upcoming ({upcoming.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {upcoming.length === 0 ? (
                <EmptyState onSchedule={() => setModalOpen(true)} />
              ) : (
                upcoming.map((i) => (
                  <article
                    key={i.id}
                    className="bg-card rounded-xl ring-1 ring-border p-5 hover:ring-white/20 transition-all group"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <CompanyLogo company={i.company} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold truncate">{i.company}</h3>
                        <p className="text-xs text-muted-foreground truncate">{i.role}</p>
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded shrink-0 ${
                          typeColors[i.type] ?? "bg-primary/10 text-primary"
                        }`}
                      >
                        {i.type}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="size-3.5 shrink-0" />
                        {formatDate(i.interviewDate)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-3.5 shrink-0" />
                        {formatTime(i.interviewDate)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="size-3.5 shrink-0" />
                        {i.platform}
                      </div>
                    </div>

                    {/* Prep Notes */}
                    {i.prepNotes && (
                      <p className="mt-3 text-xs text-muted-foreground bg-background/60 rounded-lg px-3 py-2 leading-relaxed line-clamp-2">
                        📝 {i.prepNotes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-5 flex gap-2">
                      <button
                        id={`mark-complete-${i.id}`}
                        onClick={() => complete(i.id)}
                        disabled={isCompleting}
                        className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium py-2 rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50"
                        title="Mark as completed"
                      >
                        <Circle className="size-3.5" />
                        Mark Complete
                      </button>
                      <button
                        id={`delete-interview-${i.id}`}
                        onClick={() => removeInterview(i.id)}
                        disabled={isRemoving}
                        className="p-2 rounded-md border border-border text-muted-foreground hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                        title="Delete interview"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Past / Completed Interviews */}
          <section className="mt-10">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Past Interviews ({past.length})
            </h2>
            {past.length === 0 ? (
              <div className="bg-card rounded-xl ring-1 ring-border p-8 text-center text-sm text-muted-foreground">
                Your interview history will appear here after each round is marked complete.
              </div>
            ) : (
              <div className="bg-card rounded-xl ring-1 ring-border divide-y divide-border">
                {past.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors"
                  >
                    <CompanyLogo company={i.company} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{i.company}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.role}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {formatDate(i.interviewDate)}
                    </div>
                    <span
                      className={`hidden sm:inline text-[10px] uppercase tracking-wider px-2 py-1 rounded ${
                        typeColors[i.type] ?? "bg-primary/10 text-primary"
                      }`}
                    >
                      {i.type}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {i.isCompleted ? (
                        <CheckCircle2 className="size-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-muted-foreground/60">Past</span>
                      )}
                    </div>
                    <button
                      id={`delete-past-interview-${i.id}`}
                      onClick={() => removeInterview(i.id)}
                      disabled={isRemoving}
                      className="p-1.5 rounded text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Schedule Modal */}
      {modalOpen && <ScheduleModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}
