import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Trophy, BellRing, Activity, Loader2, CheckCheck } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from "@/hooks/useNotifications";
import type { NotificationType } from "@/lib/notification-api";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · CareerPilot" },
      { name: "description", content: "All your reminders and updates in one feed." },
    ],
  }),
  component: NotificationsPage,
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function iconFor(type: NotificationType) {
  switch (type) {
    case "interview": return <CalendarClock className="size-4 text-primary" />;
    case "offer":     return <Trophy className="size-4 text-[oklch(0.85_0.17_162)]" />;
    case "reminder":  return <BellRing className="size-4 text-[oklch(0.82_0.16_80)]" />;
    case "system":    return <Activity className="size-4 text-muted-foreground" />;
  }
}

/** Format ISO timestamp as a short label */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins  = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 60)  return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1d ago";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

function NotificationsPage() {
  const { notifications, unreadCount, isLoading, isError } = useNotifications();
  const { markRead } = useMarkRead();
  const { markAllRead, isMarkingAll } = useMarkAllRead();

  return (
    <AppShell
      title="Notifications"
      subtitle={`${unreadCount} unread · stay on top of interviews, offers, and reminders.`}
      action={
        <button
          id="mark-all-read-btn"
          onClick={() => markAllRead()}
          disabled={isMarkingAll || unreadCount === 0}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3.5 py-2 rounded-md border border-border bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMarkingAll ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCheck className="size-3.5" />
          )}
          Mark all as read
        </button>
      }
    >
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading notifications…
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Failed to load notifications. Please refresh.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && notifications.length === 0 && (
        <div className="py-20 text-center text-sm text-muted-foreground">
          You're all caught up — no notifications yet. 🎉
        </div>
      )}

      {/* Notification list */}
      {!isLoading && !isError && notifications.length > 0 && (
        <div className="bg-card rounded-xl ring-1 ring-border divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n.id}
              id={`notification-${n.id}`}
              onClick={() => {
                if (!n.isRead) markRead(n.id);
              }}
              className={`p-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-accent/30 ${
                n.isRead ? "opacity-60" : ""
              }`}
            >
              {/* Icon */}
              <div className="size-9 rounded-lg bg-accent grid place-items-center shrink-0">
                {iconFor(n.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-sm font-medium truncate">{n.title}</h3>
                  {!n.isRead && (
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {n.description}
                </p>
              </div>

              {/* Timestamp */}
              <span className="text-xs text-muted-foreground shrink-0">
                {formatTime(n.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
