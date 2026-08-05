// ─────────────────────────────────────────────────────────────
// Resume API client — /api/resumes
//   Uses the shared apiFetch from api.ts for JSON endpoints.
//   uploadResume uses raw fetch + FormData (multipart/form-data).
//   Mirrors the Applications & Interviews API structure exactly.
// ─────────────────────────────────────────────────────────────

import { apiFetch, getToken } from "@/lib/api";

const BASE_URL = "http://localhost:9091";

// ─── DTO Types ────────────────────────────────────────────────

/**
 * Mirrors the backend ResumeResponse record.
 * Returned by GET /api/resumes and POST /api/resumes.
 */
export interface ResumeResponse {
  id: string;
  /** Original file name e.g. "Jane_Doe_Resume.pdf" */
  name: string;
  /** User-supplied label e.g. "Frontend_Specialist_v2" */
  version: string;
  /** Server-side storage path e.g. "uploads/uuid_filename.pdf" */
  filePath: string;
  /** Human-readable size e.g. "245 KB" */
  fileSize: string;
  /** How many job applications reference this resume */
  applicationCount: number;
  /** ISO-8601 UTC creation timestamp e.g. "2026-07-29T11:00:00Z" */
  createdAt: string;
}

// ─── API Functions ────────────────────────────────────────────

/**
 * GET /api/resumes
 *
 * Retrieves all resume versions for the authenticated user.
 * Used in: resumes.tsx (resume cards grid).
 */
export async function getResumes(): Promise<ResumeResponse[]> {
  return apiFetch<ResumeResponse[]>("/api/resumes");
}

/**
 * POST /api/resumes  (multipart/form-data)
 *
 * Uploads a resume file (PDF / DOCX) with an optional version label.
 * Uses raw fetch — NOT apiFetch — because Content-Type must be
 * omitted so the browser sets the correct multipart boundary.
 *
 * Used in: drag-and-drop upload dialog in resumes.tsx.
 *
 * @param file    The File object selected by the user
 * @param version A short label e.g. "Frontend_Specialist_v2"
 */
export async function uploadResume(
  file: File,
  version: string
): Promise<ResumeResponse> {
  const token = getToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("version", version);

  // Do NOT set Content-Type — the browser adds it with the correct boundary
  const res = await fetch(`${BASE_URL}/api/resumes`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json() as Promise<ResumeResponse>;
}

/**
 * GET /api/resumes/{id}/download
 *
 * Downloads the binary file and triggers a browser Save-As dialog.
 * Used in: Download button on each resume card in resumes.tsx.
 */
export async function downloadResume(
  id: string,
  fileName: string
): Promise<void> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}/api/resumes/${id}/download`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
    throw new Error("Session expired.");
  }

  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  // Convert response to a blob and create a temporary download link
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * DELETE /api/resumes/{id}
 *
 * Permanently removes a resume and its stored file.
 * Used in: Delete option in the MoreHorizontal menu on resume cards.
 * Returns 204 No Content (undefined).
 */
export async function deleteResume(id: string): Promise<void> {
  return apiFetch<void>(`/api/resumes/${id}`, { method: "DELETE" });
}
