// ─────────────────────────────────────────────────────────────
// Interview API client — /api/interviews
//   Uses the shared apiFetch from api.ts (JWT auth, error handling)
//   Mirrors the Applications API structure exactly.
// ─────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";

// ─── DTO Types ────────────────────────────────────────────────

export type InterviewType = "Technical Screen" | "Behavioral" | "Final Round";
export type InterviewPlatform = "Zoom" | "Google Meet" | "On-site";

/**
 * Mirrors the backend InterviewResponse record.
 * Returned by all GET / POST / PUT / PATCH endpoints.
 */
export interface InterviewResponse {
  id: string;
  applicationId?: string;
  company: string;
  role: string;
  type: InterviewType;
  /** ISO-8601 UTC datetime e.g. "2026-08-05T14:00:00Z" */
  interviewDate: string;
  platform: InterviewPlatform;
  prepNotes?: string;
  isCompleted: boolean;
}

/**
 * Mirrors CreateInterviewRequest / UpdateInterviewRequest.
 * Used by POST and PUT endpoints.
 */
export interface InterviewPayload {
  applicationId?: string;
  company: string;
  role: string;
  type: InterviewType;
  /** ISO-8601 UTC datetime */
  interviewDate: string;
  platform: InterviewPlatform;
  prepNotes?: string;
}

// ─── API Functions ────────────────────────────────────────────

/**
 * GET /api/interviews
 *
 * Retrieves all interviews for the authenticated user.
 * Used in: interviews.tsx (grid view), index.tsx (upcoming panel).
 */
export async function getInterviews(): Promise<InterviewResponse[]> {
  return apiFetch<InterviewResponse[]>("/api/interviews");
}

/**
 * POST /api/interviews
 *
 * Schedules a new interview round.
 * Used in: "Schedule Interview" modal in interviews.tsx.
 *
 * Validation (backend-enforced):
 *  - company, role, type, interviewDate, platform: required
 *  - type: "Technical Screen" | "Behavioral" | "Final Round"
 *  - platform: "Zoom" | "Google Meet" | "On-site"
 */
export async function createInterview(
  payload: InterviewPayload
): Promise<InterviewResponse> {
  return apiFetch<InterviewResponse>("/api/interviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /api/interviews/:id
 *
 * Full update of an interview — date, notes, platform, etc.
 * Used in: Edit interview dialog in interviews.tsx.
 */
export async function updateInterview(
  id: string,
  payload: Partial<InterviewPayload>
): Promise<InterviewResponse> {
  return apiFetch<InterviewResponse>(`/api/interviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/interviews/:id/complete
 *
 * Toggles interview status to completed after finishing the round.
 * Used in: Checkbox action on interview cards in interviews.tsx.
 */
export async function markInterviewComplete(
  id: string
): Promise<InterviewResponse> {
  return apiFetch<InterviewResponse>(`/api/interviews/${id}/complete`, {
    method: "PATCH",
  });
}

/**
 * DELETE /api/interviews/:id
 *
 * Permanently removes an interview round.
 * Used in: Delete action on interview cards in interviews.tsx.
 * Returns 204 No Content (undefined).
 */
export async function deleteInterview(id: string): Promise<void> {
  return apiFetch<void>(`/api/interviews/${id}`, { method: "DELETE" });
}
