// ─────────────────────────────────────────────────────────────
// Offer API client — /api/offers
//   Uses the shared apiFetch from api.ts (JWT auth, error handling)
//   Mirrors the Applications & Interviews API structure exactly.
// ─────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";

// ─── DTO Types ────────────────────────────────────────────────

/** Possible lifecycle states of an offer */
export type OfferStatus = "pending" | "accepted" | "rejected" | "negotiating";

/**
 * Mirrors the backend OfferResponse record.
 * Returned by GET /api/offers and POST /api/offers.
 */
export interface OfferResponse {
  id: string;
  applicationId?: string;
  company: string;
  role: string;
  /** Annual base salary in USD */
  base: number;
  /** Equity percentage string e.g. "0.05%" */
  equity: string;
  /** Sign-on bonus in USD */
  bonus: number;
  location: string;
  /** ISO-8601 UTC deadline e.g. "2026-08-15T23:59:59Z" */
  deadline: string;
  /** 0–100 match score */
  matchPercentage: number;
  status: OfferStatus;
}

/**
 * Mirrors CreateOfferRequest.
 * Used by POST /api/offers.
 */
export interface OfferPayload {
  applicationId?: string;
  company: string;
  role: string;
  base: number;
  equity: string;
  bonus: number;
  location: string;
  /** ISO-8601 UTC deadline */
  deadline: string;
  matchPercentage: number;
}

// ─── API Functions ────────────────────────────────────────────

/**
 * GET /api/offers
 *
 * Retrieves all job offers for the authenticated user.
 * Used in: offers.tsx (comparison cards & side-by-side table).
 */
export async function getOffers(): Promise<OfferResponse[]> {
  return apiFetch<OfferResponse[]>("/api/offers");
}

/**
 * POST /api/offers
 *
 * Logs a new job offer with compensation details.
 * Used in: "Log Offer" modal in offers.tsx.
 */
export async function createOffer(payload: OfferPayload): Promise<OfferResponse> {
  return apiFetch<OfferResponse>("/api/offers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/offers/:id/status
 *
 * Updates the decision status of an offer.
 * Used in: Accept / Decline / Negotiate buttons in offers.tsx.
 *
 * Allowed status values: "accepted" | "rejected" | "negotiating"
 */
export async function updateOfferStatus(
  id: string,
  status: OfferStatus
): Promise<OfferResponse> {
  return apiFetch<OfferResponse>(`/api/offers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
