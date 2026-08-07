import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Settings, Moon, Sun, User as UserIcon, Mail } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · CareerPilot" },
      { name: "description", content: "Manage your account and application preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, initials, isLoading } = useCurrentUser();

  return (
    <AppShell
      title="Settings"
      subtitle="Manage your account preferences and application settings."
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Profile Section */}
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="font-semibold flex items-center gap-2">
              <UserIcon className="size-4 text-primary" />
              Your Profile
            </h2>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center gap-4 animate-pulse">
                <div className="size-16 rounded-full bg-accent" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-accent rounded" />
                  <div className="h-3 w-48 bg-accent rounded" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <div className="size-16 rounded-full bg-gradient-to-br from-primary to-chart-2 grid place-items-center text-xl font-semibold text-primary-foreground shadow-sm">
                  {initials || "??"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user?.fullName ?? "Unknown User"}</h3>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                    <Mail className="size-3.5" />
                    <span className="text-sm">{user?.email ?? "No email provided"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="font-semibold flex items-center gap-2">
              <Settings className="size-4 text-primary" />
              Appearance
            </h2>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Theme Mode</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Toggle between dark and light mode for the application interface.
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded-md transition-colors text-sm font-medium border border-border"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="size-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="size-4" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
