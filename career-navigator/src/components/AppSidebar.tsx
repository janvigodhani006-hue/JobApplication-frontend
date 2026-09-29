import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LogOut, X, Menu } from "lucide-react";
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

// Bottom nav items for mobile (most important 5)
const bottomNavItems = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/applications", label: "Apps", icon: Briefcase },
  { to: "/kanban", label: "Kanban", icon: KanbanSquare },
  { to: "/interviews", label: "Schedule", icon: CalendarClock },
  { to: "/notifications", label: "Alerts", icon: Bell },
] as const;

interface SidebarContentProps {
  pathname: string;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  onClose?: () => void;
}

function SidebarContent({ pathname, searchOpen, setSearchOpen, onClose }: SidebarContentProps) {
  const { user, initials, isLoading } = useCurrentUser();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo row */}
      <div className="p-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="size-7 rounded-md bg-primary grid place-items-center shadow-[var(--shadow-glow)]">
            <div className="size-2.5 rounded-sm bg-primary-foreground/80" />
          </div>
          <span className="font-semibold tracking-tight">CareerPilot</span>
        </Link>
        {/* Close button — only shown inside mobile drawer */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="size-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Search */}
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

      {/* Nav groups */}
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
                    onClick={onClose}
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

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <Settings className="size-4" />
          Settings
        </Link>

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
          <button
            onClick={handleLogout}
            title="Log out"
            className="shrink-0 size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Close drawer on route change
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      {/* ── Desktop sidebar (lg+) ──────────────────────────── */}
      <aside className="hidden lg:flex w-64 border-r border-border flex-col shrink-0 bg-sidebar">
        <SidebarContent
          pathname={pathname}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
        />
      </aside>

      {/* ── Mobile top bar (< lg) ──────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-sidebar border-b border-border flex items-center px-4 gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Menu className="size-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 flex-1">
          <div className="size-6 rounded-md bg-primary grid place-items-center shadow-[var(--shadow-glow)]">
            <div className="size-2 rounded-sm bg-primary-foreground/80" />
          </div>
          <span className="font-semibold tracking-tight text-sm">CareerPilot</span>
        </Link>

        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Search className="size-4" />
        </button>
      </header>

      {/* ── Mobile drawer backdrop ─────────────────────────── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-in drawer ─────────────────────────── */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-sidebar border-r border-border flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation menu"
      >
        <SidebarContent
          pathname={pathname}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>

      {/* ── Mobile bottom navigation bar (< md) ──────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-border flex items-center justify-around h-16 px-2 safe-area-bottom"
        aria-label="Bottom navigation"
      >
        {bottomNavItems.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`size-5 ${active ? "drop-shadow-[0_0_6px_var(--color-primary)]" : ""}`} />
              <span className="text-[9px] font-medium leading-none truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
