// ─────────────────────────────────────────────────────────────
// Activity API client — /api/activities
//   Uses the shared apiFetch from api.ts (JWT auth, error handling).
//   Returns a paginated feed of user events (status changes, uploads, etc.)
// ─────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";

// ─── DTO Types ────────────────────────────────────────────────

/**
 * Activity event types produced by the backend.
 * Mirrors the ActivityType enum in Spring Boot.
 */
export type ActivityType =
  | "moved"
  | "applied"
  | "offer"
  | "resume"
  | "rejected"
  | "note";

/**
 * Mirrors the backend ActivityResponse record.
 * Returned inside the `content[]` array of the paginated response.
 */
export interface ActivityResponse {
  id: string;
  type: ActivityType;
  /** Human-readable description e.g. "Moved Google application to Interview stage" */
  message: string;
  /** Optional extra context e.g. "Technical Screen scheduled" */
  detail?: string;
  /** ISO-8601 UTC timestamp e.g. "2026-07-29T14:30:00Z" */
  createdAt: string;
}

/** Spring Data page wrapper returned by GET /api/activities */
export interface ActivityPage {
  content: ActivityResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ─── API Function ─────────────────────────────────────────────

/**
 * GET /api/activities?page=0&size=10
 *
 * Retrieves the most recent activity events for the authenticated user.
 * Used in: routes/index.tsx Recent Activity Feed widget.
 *
 * @param page  Zero-based page index (default 0)
 * @param size  Number of items per page (default 10)
 */
export async function getActivities(
  page = 0,
  size = 10
): Promise<ActivityPage> {
  return apiFetch<ActivityPage>(
    `/api/activities?page=${page}&size=${size}&sort=createdAt,desc`
  );
}
