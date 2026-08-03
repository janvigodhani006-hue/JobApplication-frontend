import { useQuery } from "@tanstack/react-query";
import { getMe, getToken, type UserResponse } from "@/lib/api";

/**
 * useCurrentUser
 *
 * Fetches the active user's profile from GET /api/auth/me.
 *
 * - Only runs when a JWT token is present in localStorage.
 * - Caches for 10 minutes (staleTime) to avoid hammering the server on
 *   every re-render while still refreshing if the user navigates away
 *   and comes back.
 * - Returns { user, isLoading, isError } for convenient consumption.
 *
 * Used in:
 *   - AppSidebar.tsx  → avatar badge, name, email
 *   - index.tsx       → personalised dashboard greeting ("Good morning, Alex")
 */
export function useCurrentUser() {
  const hasToken = Boolean(getToken());

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery<UserResponse, Error>({
    queryKey: ["currentUser"],
    queryFn: getMe,
    // Don't fetch at all when the user is not logged in (login page)
    enabled: hasToken,
    // Keep data fresh for 10 minutes
    staleTime: 10 * 60 * 1000,
    // Don't retry on 401 — the apiFetch already redirects on 401
    retry: (failureCount, err) => {
      if (err.message.startsWith("Session expired")) return false;
      return failureCount < 2;
    },
  });

  /** Derives the user's first name from the fullName field */
  const firstName = user?.fullName?.split(" ")[0] ?? "";

  /** Derives two-letter initials (e.g. "Alex Chen" → "AC") */
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("")
    : "";

  return { user, firstName, initials, isLoading, isError, error };
}
