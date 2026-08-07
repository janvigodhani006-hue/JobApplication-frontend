import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { logout } from "@/lib/api";
import { useState, useEffect } from "react";
import { SearchModal } from "@/components/SearchModal";
import {
  LayoutDashboard,
  Briefcase,
  KanbanSquare,
  CalendarClock,
  FileText,
  Trophy,
  BarChart3,
  Bell,
  Settings,
  Search,
} from "lucide-react";

const nav = [
  {
    label: "Management",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/applications", label: "Applications", icon: Briefcase },
      { to: "/kanban", label: "Kanban", icon: KanbanSquare },
      { to: "/interviews", label: "Interviews", icon: CalendarClock },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/resumes", label: "Resumes", icon: FileText },
      { to: "/offers", label: "Offers", icon: Trophy },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
] as const;

export function AppSidebar() {
  const { user, initials, isLoading } = useCurrentUser();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex w-64 border-r border-border flex-col shrink-0 bg-sidebar">
      <div className="p-5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="size-7 rounded-md bg-primary grid place-items-center shadow-[var(--shadow-glow)]">
            <div className="size-2.5 rounded-sm bg-primary-foreground/80" />
          </div>
          <span className="font-semibold tracking-tight">CareerPilot</span>
        </Link>
      </div>

      <div className="px-4 pb-3">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground bg-accent/40 hover:bg-accent transition-colors rounded-md border border-border"
        >
          <Search className="size-3.5" />
          <span>Quick search</span>
          <kbd className="ml-auto text-[10px] font-mono opacity-60">⌘K</kbd>
        </button>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.label}>
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-accent text-primary ring-1 ring-border font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <Settings className="size-4" />
          Settings
        </Link>

        {/* Logged-in user profile — populated from GET /api/auth/me */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-8 rounded-full bg-gradient-to-br from-primary to-chart-2 grid place-items-center text-xs font-semibold text-primary-foreground shrink-0">
            {isLoading ? "…" : (initials || "??")}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium truncate">
              {isLoading ? "Loading…" : (user?.fullName ?? "Unknown User")}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {isLoading ? "" : (user?.email ?? "")}
            </span>
          </div>
          {/* Logout button */}
          <button
            onClick={handleLogout}
            title="Log out"
            className="shrink-0 size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
