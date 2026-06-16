import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Trophy, BellRing, Activity } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { notifications, type Notification } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · CareerPilot" },
      { name: "description", content: "All your reminders and updates in one feed." },
    ],
  }),
  component: NotificationsPage,
});

function iconFor(type: Notification["type"]) {
  switch (type) {
    case "interview": return <CalendarClock className="size-4 text-primary" />;
    case "offer": return <Trophy className="size-4 text-[oklch(0.85_0.17_162)]" />;
    case "reminder": return <BellRing className="size-4 text-[oklch(0.82_0.16_80)]" />;
    case "system": return <Activity className="size-4 text-muted-foreground" />;
  }
}

function NotificationsPage() {
  const unread = notifications.filter((n) => n.unread).length;
  return (
    <AppShell
      title="Notifications"
      subtitle={`${unread} unread · stay on top of interviews, offers, and reminders.`}
      action={
        <button className="text-sm text-muted-foreground hover:text-foreground px-3.5 py-2 rounded-md border border-border bg-card transition-colors">
          Mark all as read
        </button>
      }
    >
      <div className="bg-card rounded-xl ring-1 ring-border divide-y divide-border">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 flex items-start gap-3 hover:bg-accent/30 transition-colors ${
              n.unread ? "" : "opacity-70"
            }`}
          >
            <div className="size-9 rounded-lg bg-accent grid place-items-center shrink-0">
              {iconFor(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-medium truncate">{n.title}</h3>
                {n.unread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
