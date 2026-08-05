/**
 * useDashboardStats.ts
 *
 * TanStack React Query hook for the Dashboard Stats resource.
 *
 * Hook exported:
 *  - useDashboardStats()  → GET /api/dashboard/stats
 *
 * Returns the full pre-aggregated payload used by:
 *  - routes/index.tsx     (stat counters + monthly trend chart)
 *  - routes/analytics.tsx (all charts + KPI cards)
 */

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  type DashboardStatsResponse,
} from "@/lib/dashboard-api";

// Stable query key — keeps cache consistent across every consumer
export const DASHBOARD_STATS_QUERY_KEY = ["dashboard", "stats"] as const;

/**
 * Fetches the consolidated dashboard stats for the logged-in user.
 *
 * Usage:
 *   const { stats, isLoading, isError } = useDashboardStats();
 *   stats.totalApps, stats.monthlyTrends, stats.statusBreakdowns, etc.
 */
export function useDashboardStats() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: getDashboardStats,
    staleTime: 2 * 60 * 1000, // treat data as fresh for 2 min
  });

  // Safe fallback so consumers never need to null-check
  const empty: DashboardStatsResponse = {
    totalApps: 0,
    activeApps: 0,
    interviewsCount: 0,
    offersCount: 0,
    rejectionsCount: 0,
    successRate: 0,
    monthlyTrends: [],
    statusBreakdowns: [],
    sourceBreakdowns: [],
  };

  return {
    stats: data ?? empty,
    isLoading,
    isError,
    error,
    refetch,
  };
}
