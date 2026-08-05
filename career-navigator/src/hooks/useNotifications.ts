/**
 * useNotifications.ts
 *
 * TanStack React Query hooks for the Notifications resource.
 *
 * Hooks exported:
 *  - useNotifications()     → GET  /api/notifications
 *  - useMarkRead()          → POST /api/notifications/:id/read  (optimistic)
 *  - useMarkAllRead()       → POST /api/notifications/read-all
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationResponse,
} from "@/lib/notification-api";

// Stable query key — shared between the bell badge and the full page
export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

// ─────────────────────────────────────────────────────────────
// READ — GET /api/notifications
// ─────────────────────────────────────────────────────────────

/**
 * Fetches all notifications for the logged-in user.
 *
 * Usage:
 *   const { notifications, unreadCount, isLoading } = useNotifications();
 */
export function useNotifications() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getNotifications,
    staleTime: 60 * 1000, // 1 min
  });

  const notifications: NotificationResponse[] = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────
// MARK ONE READ — POST /api/notifications/:id/read
// ─────────────────────────────────────────────────────────────

/**
 * Optimistically marks a single notification as read.
 * The dot disappears immediately; rolls back on server error.
 *
 * Usage:
 *   const { markRead } = useMarkRead();
 *   markRead("uuid");
 */
export function useMarkRead() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),

    // Optimistic — flip isRead immediately in cache
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous =
        queryClient.getQueryData<NotificationResponse[]>(NOTIFICATIONS_QUERY_KEY);

      queryClient.setQueryData<NotificationResponse[]>(
        NOTIFICATIONS_QUERY_KEY,
        (old) =>
          old
            ? old.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            : old
      );

      return { previous };
    },

    // Roll back on server error
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
    },

    // Sync server response into cache
    onSuccess: (updated) => {
      queryClient.setQueryData<NotificationResponse[]>(
        NOTIFICATIONS_QUERY_KEY,
        (old) =>
          old
            ? old.map((n) => (n.id === updated.id ? updated : n))
            : [updated]
      );
    },
  });

  return {
    markRead: mutation.mutate,
    isMarking: mutation.isPending,
  };
}

// ─────────────────────────────────────────────────────────────
// MARK ALL READ — POST /api/notifications/read-all
// ─────────────────────────────────────────────────────────────

/**
 * Marks every notification as read in one call.
 * Optimistically sets all isRead = true in the cache.
 *
 * Usage:
 *   const { markAllRead, isMarkingAll } = useMarkAllRead();
 *   markAllRead();
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: markAllNotificationsRead,

    // Optimistic — set all isRead = true immediately
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous =
        queryClient.getQueryData<NotificationResponse[]>(NOTIFICATIONS_QUERY_KEY);

      queryClient.setQueryData<NotificationResponse[]>(
        NOTIFICATIONS_QUERY_KEY,
        (old) => (old ? old.map((n) => ({ ...n, isRead: true })) : old)
      );

      return { previous };
    },

    // Roll back on server error
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
    },

    // Full refetch to sync server truth after success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  return {
    markAllRead: mutation.mutate,
    isMarkingAll: mutation.isPending,
  };
}
