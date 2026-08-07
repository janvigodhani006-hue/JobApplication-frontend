import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Briefcase, CalendarClock, X } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { useInterviews } from "@/hooks/useInterviews";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { apps } = useApplications();
  const { interviews } = useInterviews();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const q = query.toLowerCase().trim();

  const matchedApps = q
    ? apps
        .filter(
          (a) =>
            a.company.toLowerCase().includes(q) ||
            a.role.toLowerCase().includes(q)
        )
        .slice(0, 5)
    : [];

  const matchedInterviews = q
    ? interviews
        .filter(
          (i) =>
            i.company.toLowerCase().includes(q) ||
            i.role.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  const hasResults = matchedApps.length > 0 || matchedInterviews.length > 0;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — z-[60] sits ABOVE the backdrop so clicks don't bleed through */}
      <div
        className="fixed inset-x-0 top-[15%] z-[60] mx-auto w-full max-w-xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search applications, companies, roles…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
            <kbd className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {!q && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Start typing to search your applications and interviews…
              </div>
            )}

            {q && !hasResults && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No results found for "
                <span className="text-foreground">{query}</span>"
              </div>
            )}

            {matchedApps.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Applications
                </div>
                {matchedApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      navigate({ to: "/applications" });
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/60 transition-colors text-left"
                  >
                    <div className="size-8 rounded-lg bg-accent grid place-items-center shrink-0">
                      <Briefcase className="size-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{app.role}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.company}
                      </p>
                    </div>
                    <span className="ml-auto text-[10px] text-muted-foreground capitalize shrink-0">
                      {app.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {matchedInterviews.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Interviews
                </div>
                {matchedInterviews.map((iv) => (
                  <button
                    key={iv.id}
                    onClick={() => {
                      navigate({ to: "/interviews" });
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/60 transition-colors text-left"
                  >
                    <div className="size-8 rounded-lg bg-accent grid place-items-center shrink-0">
                      <CalendarClock className="size-3.5 text-chart-2" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{iv.role}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {iv.company}
                      </p>
                    </div>
                    <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                      {new Date(iv.interviewDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-border text-[10px] text-muted-foreground flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-muted px-1 rounded">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono bg-muted px-1 rounded">↵</kbd> select
            </span>
            <span>
              <kbd className="font-mono bg-muted px-1 rounded">esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
