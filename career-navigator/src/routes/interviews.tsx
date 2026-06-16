import { createFileRoute } from "@tanstack/react-router";
import { Video, Calendar, Clock } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CompanyLogo } from "@/components/CompanyLogo";
import { interviews } from "@/lib/mock-data";

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Interviews · CareerPilot" },
      { name: "description", content: "All your upcoming interviews scheduled in one place." },
    ],
  }),
  component: InterviewsPage,
});

function InterviewsPage() {
  return (
    <AppShell
      title="Interviews"
      subtitle="Upcoming rounds across companies — schedule, prep notes, and platform links."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {interviews.map((i) => (
          <article
            key={i.id}
            className="bg-card rounded-xl ring-1 ring-border p-5 hover:ring-white/20 transition-all"
          >
            <div className="flex items-start gap-3 mb-4">
              <CompanyLogo company={i.company} size="md" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold truncate">{i.company}</h3>
                <p className="text-xs text-muted-foreground truncate">{i.role}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-primary/10 text-primary rounded">
                {i.type}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-3.5" /> {i.date}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5" /> {i.time}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Video className="size-3.5" /> {i.platform}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="flex-1 text-xs font-medium py-2 rounded-md bg-primary text-primary-foreground hover:brightness-110 transition-all">
                Join call
              </button>
              <button className="flex-1 text-xs font-medium py-2 rounded-md border border-border hover:bg-accent transition-colors">
                Prep notes
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium mb-4">Past Interviews</h2>
        <div className="bg-card rounded-xl ring-1 ring-border p-8 text-center text-sm text-muted-foreground">
          Your interview history will appear here after each round is marked complete.
        </div>
      </div>
    </AppShell>
  );
}
