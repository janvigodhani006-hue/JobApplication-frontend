/**
 * useActivities.ts
 *
 * TanStack React Query hook for the Activity Feed resource.
 *
 * Hook exported:
 *  - useActivities()  → GET /api/activities?page=0&size=10
 *
 * Used in: routes/index.tsx Recent Activity widget.
 */

import { useQuery } from "@tanstack/react-query";
import { getActivities, type ActivityResponse } from "@/lib/activity-api";

// Stable query key
export const ACTIVITIES_QUERY_KEY = ["activities"] as const;

/**
 * Fetches the 10 most recent activity events for the logged-in user.
 *
 * Usage:
 *   const { activities, isLoading, isError } = useActivities();
 */
export function useActivities() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ACTIVITIES_QUERY_KEY,
    queryFn: () => getActivities(0, 10),
    staleTime: 60 * 1000, // 1 min — activity changes frequently
  });

  const activities: ActivityResponse[] = data?.content ?? [];

  return {
    activities,
    isLoading,
    isError,
    error,
    refetch,
  };
}
