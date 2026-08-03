import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MoreHorizontal, Plus, Loader2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { statusLabels, type AppStatus } from "@/lib/api";
import { useApplications, useUpdateAppStatus } from "@/hooks/useApplications";
import type { ApplicationResponse } from "@/lib/api";

export const Route = createFileRoute("/kanban")({
  head: () => ({
    meta: [
      { title: "Kanban · CareerPilot" },
      {
        name: "description",
        content: "Drag-and-drop pipeline view of all your applications.",
      },
    ],
  }),
  component: KanbanPage,
});

const COLUMNS: AppStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
  "archived",
];

function KanbanPage() {
  // ── Real data from backend ─────────────────────────────────
  const { apps, isLoading, isError } = useApplications();

  // ── PATCH /api/applications/:id/status on drop ────────────
  const { patchStatus } = useUpdateAppStatus();

  // ── Drag state ────────────────────────────────────────────
  const [dragId, setDragId] = useState<string | null>(null);

  function onDragStart(id: string) {
    setDragId(id);
  }

  async function onDrop(status: AppStatus) {
    if (!dragId) return;
    const draggedApp = apps.find((a) => a.id === dragId);
    // Only call the backend if the status actually changed
    if (draggedApp && draggedApp.status !== status) {
      await patchStatus({ id: dragId, status });
    }
    setDragId(null);
  }

  return (
    <AppShell
      title="Pipeline"
      subtitle="Drag any card across columns to update its status. Changes saved to database instantly."
    >
      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your pipeline…
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="py-20 text-center text-sm text-destructive">
          Failed to load applications. Is the backend running?
        </div>
      )}

      {/* Board */}
      {!isLoading && !isError && (
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
          {COLUMNS.map((col) => {
            const items = apps.filter(
              (a) => a.status === col,
            ) as ApplicationResponse[];

            return (
              <div
                key={col}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(col)}
                className="min-w-[300px] w-[300px] bg-card/60 ring-1 ring-border rounded-xl p-3 flex flex-col gap-3"
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-1.5 py-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full ${
                        col === "interview"
                          ? "bg-primary"
                          : col === "offer"
                            ? "bg-[oklch(0.78_0.17_162)]"
                            : col === "rejected"
                              ? "bg-[oklch(0.7_0.18_25)]"
                              : "bg-muted-foreground/50"
                      }`}
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {statusLabels[col]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <button className="size-6 grid place-items-center text-muted-foreground hover:text-foreground rounded">
                    <Plus className="size-3.5" />
                  </button>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1">
                  {items.map((a) => (
                    <KanbanCard
                      key={a.id}
                      app={a}
                      isDragging={dragId === a.id}
                      onDragStart={() => onDragStart(a.id)}
                    />
                  ))}

                  {items.length === 0 && (
                    <div className="border border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
                      Drop a card here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Kanban Card
// ─────────────────────────────────────────────────────────────
function KanbanCard({
  app,
  isDragging,
  onDragStart,
}: {
  app: ApplicationResponse;
  isDragging: boolean;
  onDragStart: () => void;
}) {
  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`bg-card p-3.5 rounded-lg ring-1 ring-border hover:ring-white/20 transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${app.status === "interview" ? "border-l-2 border-primary" : ""} ${
        app.status === "rejected" || app.status === "archived"
          ? "opacity-70"
          : ""
      }`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Color dot from logoColor */}
          <span
            className="size-5 rounded-md shrink-0 grid place-items-center text-[9px] font-bold ring-1 ring-white/10"
            style={{
              background: app.logoColor ?? "var(--color-accent)",
              color:
                app.logoColor === "#ffffff" || app.logoColor === "#ededed"
                  ? "#000"
                  : "#fff",
            }}
          >
            {app.company.charAt(0)}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            {app.company}
          </span>
        </div>
        <button className="text-muted-foreground hover:text-foreground -mr-1 -mt-1 shrink-0">
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>

      <p className="text-sm font-medium leading-snug">{app.role}</p>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{app.location}</span>
        <span className="shrink-0 ml-2">{formatDate(app.appliedDate)}</span>
      </div>

      {app.salary && (
        <p className="text-[11px] text-[oklch(0.85_0.17_162)] mt-2 font-medium">
          {app.salary} Base
        </p>
      )}

      {app.tag && (
        <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
          {app.tag}
        </span>
      )}
    </div>
  );
}
