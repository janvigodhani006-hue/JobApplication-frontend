import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Bell, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useNotifications } from "@/hooks/useNotifications";

interface AppShellProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, action, children }: AppShellProps) {
  const { unreadCount } = useNotifications();
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 lg:py-10">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 mb-8 animate-fade-in">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground text-sm sm:text-[15px] mt-1 text-pretty max-w-[60ch]">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/notifications"
                className="size-9 grid place-items-center rounded-md border border-border bg-card hover:bg-accent transition-colors relative"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
                )}
              </Link>
              {action ?? (
                <Link
                  to="/applications"
                  search={{ new: "true" }}
                  className="bg-primary text-primary-foreground text-sm font-medium px-3.5 py-2 rounded-md inline-flex items-center gap-1.5 hover:brightness-110 transition-all shadow-[var(--shadow-glow)]"
                >
                  <Plus className="size-4" />
                  New Application
                </Link>
              )}
            </div>
          </header>
          <div className="animate-slide-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
