import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { applications as initialApps, statusLabels, type Application, type AppStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/kanban")({
  head: () => ({
    meta: [
      { title: "Kanban · CareerPilot" },
      { name: "description", content: "Drag-and-drop pipeline view of all your applications." },
    ],
  }),
  component: KanbanPage,
});

const columns: AppStatus[] = ["applied", "interview", "offer", "rejected", "archived"];

function KanbanPage() {
  const [apps, setApps] = useState<Application[]>(initialApps);
  const [dragId, setDragId] = useState<string | null>(null);

  function onDragStart(id: string) {
    setDragId(id);
  }
  function onDrop(status: AppStatus) {
    if (!dragId) return;
    setApps((prev) => prev.map((a) => (a.id === dragId ? { ...a, status } : a)));
    setDragId(null);
  }

  return (
    <AppShell
      title="Pipeline"
      subtitle="Drag any card across columns to update its status. Auto-saved instantly."
    >
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
        {columns.map((col) => {
          const items = apps.filter((a) => a.status === col);
          return (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col)}
              className="min-w-[300px] w-[300px] bg-card/60 ring-1 ring-border rounded-xl p-3 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between px-1.5 py-1">
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${
                    col === "interview" ? "bg-primary" :
                    col === "offer" ? "bg-[oklch(0.78_0.17_162)]" :
                    col === "rejected" ? "bg-[oklch(0.7_0.18_25)]" :
                    "bg-muted-foreground/50"
                  }`} />
                  <span className="text-xs font-semibold text-foreground">{statusLabels[col]}</span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <button className="size-6 grid place-items-center text-muted-foreground hover:text-foreground rounded">
                  <Plus className="size-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 flex-1">
                {items.map((a) => (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={() => onDragStart(a.id)}
                    className={`bg-card p-3.5 rounded-lg ring-1 ring-border hover:ring-white/20 transition-all cursor-grab active:cursor-grabbing ${
                      dragId === a.id ? "opacity-50" : ""
                    } ${a.status === "interview" ? "border-l-2 border-primary" : ""} ${
                      a.status === "rejected" || a.status === "archived" ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="text-[11px] text-muted-foreground truncate">{a.company}</span>
                      <button className="text-muted-foreground hover:text-foreground -mr-1 -mt-1">
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-medium leading-snug">{a.role}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{a.location}</span>
                      <span>{a.appliedDate}</span>
                    </div>
                    {a.salary && (
                      <p className="text-[11px] text-[oklch(0.85_0.17_162)] mt-2 font-medium">
                        {a.salary} Base
                      </p>
                    )}
                  </div>
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
    </AppShell>
  );
}
