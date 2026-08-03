import { cn } from "@/lib/utils";

type AppStatus = "applied" | "interview" | "offer" | "rejected" | "archived";

interface CompanyLogoProps {
  company: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

export function CompanyLogo({ company, color, size = "md", className }: CompanyLogoProps) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-lg grid place-items-center font-semibold ring-1 ring-white/10",
        sizeMap[size],
        className,
      )}
      style={{
        background: color ?? "var(--color-accent)",
        color: color === "#ffffff" || color === "#ededed" ? "#000" : "#fff",
      }}
    >
      {company.charAt(0)}
    </div>
  );
}

export function statusBadgeClass(status: AppStatus) {
  switch (status) {
    case "applied":
      return "bg-accent text-muted-foreground";
    case "interview":
      return "bg-primary/10 text-primary";
    case "offer":
      return "bg-[oklch(0.78_0.17_162/0.15)] text-[oklch(0.85_0.17_162)]";
    case "rejected":
      return "bg-[oklch(0.7_0.18_25/0.12)] text-[oklch(0.78_0.16_25)]";
    case "archived":
      return "bg-accent/50 text-muted-foreground";
  }
}
