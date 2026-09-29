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
      {/*
        On mobile (< lg):
          - pt-14  = offset for the fixed top bar (56px)
          - pb-16  = offset for the fixed bottom nav bar (64px)
        On tablet (md–lg):
          - pb-0   = no bottom nav on md+
        On desktop (lg+):
          - pt-0, pb-0  = no fixed bars, sidebar is static
      */}
      <main className="flex-1 min-w-0 overflow-x-hidden pt-14 pb-16 md:pb-0 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {/* Page header */}
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-6 sm:mb-8 animate-fade-in">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-balance">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground text-xs sm:text-sm mt-1 text-pretty max-w-[60ch]">
                  {subtitle}
                </p>
              )}
            </div>
            {/* Action area — hidden on mobile to avoid crowding; bell always visible */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Notification bell — hidden on mobile (visible in top bar) */}
              <Link
                to="/notifications"
                className="hidden sm:grid size-9 place-items-center rounded-md border border-border bg-card hover:bg-accent transition-colors relative"
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
                  className="bg-primary text-primary-foreground text-xs sm:text-sm font-medium px-2.5 sm:px-3.5 py-2 rounded-md inline-flex items-center gap-1.5 hover:brightness-110 transition-all shadow-[var(--shadow-glow)]"
                >
                  <Plus className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">New Application</span>
                  <span className="sm:hidden">New</span>
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
