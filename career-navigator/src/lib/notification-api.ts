// ─────────────────────────────────────────────────────────────
// Notification API client — /api/notifications
//   Uses the shared apiFetch from api.ts (JWT auth, error handling).
//   Covers: list, mark-one-read, mark-all-read.
// ─────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";

// ─── DTO Types ────────────────────────────────────────────────

/** Notification category — controls the icon shown in the UI */
export type NotificationType = "interview" | "offer" | "reminder" | "system";

/**
 * Mirrors the backend NotificationResponse record.
 * Returned by GET /api/notifications.
 */
export interface NotificationResponse {
  id: string;
  title: string;
  description: string;
  /** ISO-8601 UTC timestamp e.g. "2026-07-29T11:00:00Z" */
  createdAt: string;
  /** false = unread (shown with blue dot), true = already read */
  isRead: boolean;
  type: NotificationType;
}

// ─── API Functions ────────────────────────────────────────────

/**
 * GET /api/notifications
 *
 * Retrieves all notifications (read + unread) for the authenticated user.
 * Used in:
 *  - routes/notifications.tsx (full notification center page)
 *  - components/AppShell.tsx (bell badge unread count)
 */
export async function getNotifications(): Promise<NotificationResponse[]> {
  return apiFetch<NotificationResponse[]>("/api/notifications");
}

/**
 * POST /api/notifications/{id}/read
 *
 * Marks a single notification as read.
 * Used in: clicking a notification row in routes/notifications.tsx.
 * Returns the updated notification.
 */
export async function markNotificationRead(
  id: string
): Promise<NotificationResponse> {
  return apiFetch<NotificationResponse>(`/api/notifications/${id}/read`, {
    method: "POST",
  });
}

/**
 * POST /api/notifications/read-all
 *
 * Marks every notification as read in one call.
 * Used in: "Mark all as read" button in routes/notifications.tsx.
 * Returns 204 No Content.
 */
export async function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>("/api/notifications/read-all", { method: "POST" });
}
