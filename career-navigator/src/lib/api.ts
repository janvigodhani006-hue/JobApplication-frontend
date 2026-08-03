// ─────────────────────────────────────────────────────────────
// Centralized API client for CareerPilot backend
//   Base URL  : http://localhost:9091
//   Auth       : JWT Bearer token stored in localStorage
//   Key        : "auth_token"
// ─────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:9091";

/** Returns the stored JWT token, if any */
export function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

/** Clears auth and redirects to /login */
export function logout() {
  localStorage.removeItem("auth_token");
  window.location.href = "/login";
}

/** Builds the standard Authorization header when a token is present */
function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Core fetch wrapper.
 * - Automatically attaches the Bearer token.
 * - Throws on non-2xx responses.
 * - Redirects to /login on 401 Unauthorized.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader(),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, { ...options, headers });

  // Expired / invalid token — boot user to login
  if (res.status === 401) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore parse error */
    }
    throw new Error(message);
  }

  // 204 No Content — return undefined
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────
// DTO types (mirrors Spring Boot response records)
// ─────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

// ─── Application ─────────────────────────────────────────────

/** The five pipeline statuses supported by the backend */
export type AppStatus = "applied" | "interview" | "offer" | "rejected" | "archived";

/** Human-readable labels for each status (replaces mock-data import) */
export const statusLabels: Record<AppStatus, string> = {
  applied:   "Applied",
  interview: "Interviewing",
  offer:     "Offer",
  rejected:  "Rejected",
  archived:  "Archived",
};

/** Mirrors the backend ApplicationResponse record */
export interface ApplicationResponse {
  id: string;
  company: string;
  role: string;
  /** "applied" | "interview" | "offer" | "rejected" | "archived" */
  status: string;
  location: string;
  salary?: string;
  appliedDate: string;   // ISO-8601 OffsetDateTime
  source: string;
  tag?: string;
  logoColor?: string;
  createdAt: string;     // ISO-8601 OffsetDateTime
}

/** Mirrors CreateApplicationRequest / UpdateApplicationRequest */
export interface ApplicationPayload {
  company: string;
  role: string;
  /** "applied" | "interview" | "offer" | "rejected" | "archived" */
  status: string;
  location: string;
  /** ISO-8601 e.g. "2026-07-29T10:00:00Z" */
  appliedDate: string;
  /** "LinkedIn" | "Referral" | "Company site" */
  source: string;
  salary?: string;
  tag?: string;
  logoColor?: string;
}

/** Spring Data page wrapper returned by GET /api/applications */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ─────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────

/** POST /api/auth/register */
export async function register(body: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** POST /api/auth/login */
export async function login(body: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * Used in: AppSidebar (user badge), Dashboard greeting.
 * Requires: Bearer token in localStorage.
 */
export async function getMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>("/api/auth/me", { method: "GET" });
}

// ─────────────────────────────────────────────────────────────
// Applications API   (all routes require JWT)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/applications?page=0&size=200&sort=appliedDate,desc
 *
 * Fetches the authenticated user's applications as a paginated page.
 * Used in: applications.tsx (table), kanban.tsx (board), index.tsx (pipeline preview).
 */
export async function getApplications(
  page = 0,
  size = 20,
): Promise<PageResponse<ApplicationResponse>> {
  return apiFetch<PageResponse<ApplicationResponse>>(
    `/api/applications?page=${page}&size=${size}&sort=appliedDate,desc`,
  );
}

/**
 * GET /api/applications/:id
 *
 * Fetches one application by UUID.
 * Used in: applications.tsx detail drawer.
 */
export async function getApplicationById(id: string): Promise<ApplicationResponse> {
  return apiFetch<ApplicationResponse>(`/api/applications/${id}`);
}

/**
 * POST /api/applications
 *
 * Creates a new job application and persists it in the database.
 * Used in: "+ New Application" modal in applications.tsx and kanban.tsx.
 */
export async function createApplication(
  payload: ApplicationPayload,
): Promise<ApplicationResponse> {
  return apiFetch<ApplicationResponse>("/api/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /api/applications/:id
 *
 * Full update of an existing application.
 * Used in: "Edit Application" dialog in applications.tsx.
 */
export async function updateApplication(
  id: string,
  payload: ApplicationPayload,
): Promise<ApplicationResponse> {
  return apiFetch<ApplicationResponse>(`/api/applications/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/applications/:id/status
 *
 * Quick-updates only the status field.
 * Used in: kanban.tsx drag-and-drop drop handler.
 */
export async function updateApplicationStatus(
  id: string,
  status: string,
): Promise<ApplicationResponse> {
  return apiFetch<ApplicationResponse>(`/api/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/**
 * DELETE /api/applications/:id
 *
 * Permanently removes an application.
 * Used in: Delete action / confirm dialog in applications.tsx.
 */
export async function deleteApplication(id: string): Promise<void> {
  return apiFetch<void>(`/api/applications/${id}`, { method: "DELETE" });
}
