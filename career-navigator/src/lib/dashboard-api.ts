// ─────────────────────────────────────────────────────────────
// Dashboard API client — /api/dashboard
//   Uses the shared apiFetch from api.ts (JWT auth, error handling).
//   Single endpoint returns all stats, charts, and breakdowns in one call.
// ─────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";

// ─── DTO Types ────────────────────────────────────────────────

/** One data point in the monthly trend array */
export interface MonthlyTrend {
  /** e.g. "May 2026" */
  month: string;
  /** Total applications submitted that month */
  count: number;
  /** Applications that reached interview/offer that month */
  interviews: number;
}

/** One slice of the status breakdown */
export interface StatusBreakdown {
  /** e.g. "applied" | "interview" | "offer" | "rejected" */
  status: string;
  count: number;
}

/** One bar of the source breakdown */
export interface SourceBreakdown {
  /** e.g. "LinkedIn" | "Referral" | "Company site" */
  source: string;
  count: number;
}

/**
 * Mirrors the backend DashboardStatsResponse record.
 * Returned by GET /api/dashboard/stats.
 */
export interface DashboardStatsResponse {
  totalApps: number;
  activeApps: number;
  interviewsCount: number;
  offersCount: number;
  rejectionsCount: number;
  /** Success rate as a percentage e.g. 8.33 */
  successRate: number;
  monthlyTrends: MonthlyTrend[];
  statusBreakdowns: StatusBreakdown[];
  sourceBreakdowns: SourceBreakdown[];
}

// ─── API Function ─────────────────────────────────────────────

/**
 * GET /api/dashboard/stats
 *
 * Returns a single pre-aggregated payload containing all stats,
 * monthly trends, status breakdowns, and source breakdowns.
 *
 * Used in:
 *  - routes/index.tsx     (Overview stat cards + monthly trend chart)
 *  - routes/analytics.tsx (All charts: bar, pie, line + KPI cards)
 */
export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return apiFetch<DashboardStatsResponse>("/api/dashboard/stats");
}
