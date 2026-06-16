import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  trend?: string;
  accent?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const accentClass = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-[oklch(0.78_0.17_162)]",
  warning: "text-[oklch(0.82_0.16_80)]",
  danger: "text-[oklch(0.7_0.18_25)]",
} as const;

export function StatCard({ label, value, trend, accent = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card p-4 rounded-xl ring-1 ring-border hover:ring-white/15 transition-all",
        className,
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2 mt-1">
        <div className={cn("text-2xl font-medium tracking-tight tabular-nums", accentClass[accent])}>
          {value}
        </div>
        {trend && <span className="text-[11px] text-muted-foreground">{trend}</span>}
      </div>
    </div>
  );
}
