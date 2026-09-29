import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Settings,
  Moon,
  Sun,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { changePassword, deleteAccount, logout } from "@/lib/api";
import { useState } from "react";

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
  const navigate = useNavigate();

  // ── Change Password state ─────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [pwLoading, setPwLoading]             = useState(false);
  const [pwError, setPwError]                 = useState<string | null>(null);
  const [pwSuccess, setPwSuccess]             = useState(false);

  // ── Delete Account state ──────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading]         = useState(false);
  const [deleteError, setDeleteError]             = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await deleteAccount();
      logout();
      navigate({ to: "/login" });
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account.");
      setDeleteLoading(false);
    }
  }

  return (
    <AppShell
      title="Settings"
      subtitle="Manage your account preferences and application settings."
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Profile Section ──────────────────────────────── */}
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

        {/* ── Appearance Section ────────────────────────────── */}
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
                <><Sun className="size-4" /> Light Mode</>
              ) : (
                <><Moon className="size-4" /> Dark Mode</>
              )}
            </button>
          </div>
        </section>

        {/* ── Change Password Section ───────────────────────── */}
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="font-semibold flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              Change Password
            </h2>
          </div>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 pr-10"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 pr-10"
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Feedback */}
            {pwError && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {pwError}
              </p>
            )}
            {pwSuccess && (
              <p className="text-sm text-primary bg-primary/10 px-3 py-2 rounded-md">
                ✓ Password changed successfully.
              </p>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:brightness-110 transition-all disabled:opacity-60"
            >
              {pwLoading && <Loader2 className="size-3.5 animate-spin" />}
              Update Password
            </button>
          </form>
        </section>

        {/* ── Danger Zone Section ───────────────────────────── */}
        <section className="bg-card rounded-xl border border-destructive/40 overflow-hidden">
          <div className="p-4 border-b border-destructive/30 bg-destructive/5">
            <h2 className="font-semibold flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-4" />
              Danger Zone
            </h2>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-start sm:justify-between gap-4">
            <div>
              <h3 className="font-medium text-sm">Delete Account</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Permanently deletes your account and all associated data including applications,
                interviews, resumes, and offers. <strong>This action cannot be undone.</strong>
              </p>
              {deleteError && (
                <p className="text-xs text-destructive mt-2">{deleteError}</p>
              )}
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-destructive text-destructive text-sm font-medium rounded-md hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-4" />
                Delete Account
              </button>
            ) : (
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Are you sure?</span>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-medium rounded-md hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {deleteLoading && <Loader2 className="size-3 animate-spin" />}
                  Yes, delete
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </AppShell>
  );
}

