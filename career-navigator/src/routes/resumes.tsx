import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, MoreHorizontal, Upload } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { resumes } from "@/lib/mock-data";

export const Route = createFileRoute("/resumes")({
  head: () => ({
    meta: [
      { title: "Resumes · CareerPilot" },
      { name: "description", content: "Version your resumes and track which one gets the most callbacks." },
    ],
  }),
  component: ResumesPage,
});

function ResumesPage() {
  return (
    <AppShell
      title="Resumes"
      subtitle="Keep multiple versions and track which one performs best with recruiters."
      action={
        <button className="bg-primary text-primary-foreground text-sm font-medium px-3.5 py-2 rounded-md inline-flex items-center gap-1.5 hover:brightness-110 transition-all shadow-[var(--shadow-glow)]">
          <Upload className="size-4" /> Upload resume
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resumes.map((r) => (
          <article
            key={r.id}
            className="bg-card rounded-xl ring-1 ring-border p-5 hover:ring-white/20 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="size-10 rounded-lg bg-accent grid place-items-center">
                <FileText className="size-5 text-primary" />
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            <h3 className="text-sm font-medium truncate">{r.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {r.version} · {r.size} · updated {r.updated}
            </p>
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold tabular-nums">{r.applications}</p>
                <p className="text-[11px] text-muted-foreground">applications used</p>
              </div>
              <button className="size-9 rounded-md border border-border grid place-items-center hover:bg-accent transition-colors">
                <Download className="size-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
