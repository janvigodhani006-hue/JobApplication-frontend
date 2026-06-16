import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · CareerPilot" },
      { name: "description", content: "Sign in to your CareerPilot account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2.5 mb-10">
            <div className="size-7 rounded-md bg-primary grid place-items-center shadow-[var(--shadow-glow)]">
              <div className="size-2.5 rounded-sm bg-primary-foreground/80" />
            </div>
            <span className="font-semibold tracking-tight">CareerPilot</span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin"
              ? "Pick up where you left off in your job search."
              : "Track every application, interview, and offer in one calm workspace."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <Field label="Full name" type="text" placeholder="Alex Chen" />
            )}
            <Field label="Email" type="email" placeholder="alex@university.edu" />
            <Field label="Password" type="password" placeholder="••••••••" />

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-medium text-sm py-2.5 rounded-md hover:brightness-110 transition-all shadow-[var(--shadow-glow)]"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
          </div>

          <button className="w-full border border-border bg-card hover:bg-accent transition-colors text-sm font-medium py-2.5 rounded-md">
            Continue with Google
          </button>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {mode === "signin" ? "New to CareerPilot? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline font-medium"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* Right — marketing panel */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-card to-background border-l border-border items-center justify-center p-10 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          background: "radial-gradient(circle at 70% 30%, var(--color-primary) 0%, transparent 50%)",
        }} />
        <div className="relative max-w-md">
          <div className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-4">
            Built for the job hunt
          </div>
          <h2 className="text-3xl font-semibold tracking-tight leading-tight text-balance">
            Track every application from first apply to signed offer.
          </h2>
          <p className="text-muted-foreground mt-4 text-pretty">
            Kanban pipeline, interview scheduler, resume versions, offer comparison, and smart analytics — all in one workspace designed for students and new grads.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              { v: "142", l: "Apps tracked" },
              { v: "32%", l: "Reply rate" },
              { v: "4", l: "Live offers" },
            ].map((s) => (
              <div key={s.l} className="p-4 rounded-lg bg-card/60 ring-1 ring-border">
                <div className="text-2xl font-semibold text-primary tabular-nums">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1.5 w-full bg-card border border-border rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}
