/**
 * useOffers.ts
 *
 * TanStack React Query hooks for the Offers resource.
 *
 * Hooks exported:
 *  - useOffers()              → GET   /api/offers
 *  - useCreateOffer()         → POST  /api/offers
 *  - useUpdateOfferStatus()   → PATCH /api/offers/:id/status
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOffers,
  createOffer,
  updateOfferStatus,
  type OfferResponse,
  type OfferPayload,
  type OfferStatus,
} from "@/lib/offer-api";

// Stable query key — keeps cache consistent across every consumer
export const OFFERS_QUERY_KEY = ["offers"] as const;

// ─────────────────────────────────────────────────────────────
// READ — GET /api/offers
// ─────────────────────────────────────────────────────────────

/**
 * Fetches all offers for the logged-in user.
 *
 * Usage:
 *   const { offers, bestOffer, isLoading } = useOffers();
 */
export function useOffers() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: OFFERS_QUERY_KEY,
    queryFn: getOffers,
    staleTime: 2 * 60 * 1000,
  });

  const offers = data ?? [];

  // The offer with the highest matchPercentage
  const bestOffer =
    offers.length > 0
      ? offers.reduce((best, o) =>
          o.matchPercentage >= best.matchPercentage ? o : best
        )
      : null;

  return {
    offers,
    bestOffer,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────
// CREATE — POST /api/offers
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for logging a new job offer.
 * Optimistically prepends the new offer to the cached list.
 *
 * Usage:
 *   const { logOffer, isLogging } = useCreateOffer();
 *   await logOffer({ company, role, base, ... });
 */
export function useCreateOffer(options?: {
  onSuccess?: (offer: OfferResponse) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: OfferPayload) => createOffer(payload),

    onSuccess: (newOffer) => {
      // Prepend new offer to cached list
      queryClient.setQueryData<OfferResponse[]>(
        OFFERS_QUERY_KEY,
        (old) => (old ? [newOffer, ...old] : [newOffer])
      );
      options?.onSuccess?.(newOffer);
    },

    onError: (err: Error) => {
      options?.onError?.(err);
    },
  });

  return {
    logOffer: mutation.mutateAsync,
    isLogging: mutation.isPending,
    logError: mutation.error,
  };
}

// ─────────────────────────────────────────────────────────────
// UPDATE STATUS — PATCH /api/offers/:id/status
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for updating an offer's decision status.
 * Optimistically updates the card status in the UI immediately.
 *
 * Usage:
 *   const { setStatus, isSettingStatus } = useUpdateOfferStatus();
 *   await setStatus({ id: "uuid", status: "accepted" });
 */
export function useUpdateOfferStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OfferStatus }) =>
      updateOfferStatus(id, status),

    // Optimistic update — flip status immediately in UI
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: OFFERS_QUERY_KEY });
      const previous = queryClient.getQueryData<OfferResponse[]>(OFFERS_QUERY_KEY);

      queryClient.setQueryData<OfferResponse[]>(
        OFFERS_QUERY_KEY,
        (old) =>
          old
            ? old.map((o) => (o.id === id ? { ...o, status } : o))
            : old
      );

      return { previous };
    },

    // Roll back on server error
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(OFFERS_QUERY_KEY, context.previous);
      }
    },

    // Sync server response into cache
    onSuccess: (updated) => {
      queryClient.setQueryData<OfferResponse[]>(
        OFFERS_QUERY_KEY,
        (old) =>
          old ? old.map((o) => (o.id === updated.id ? updated : o)) : [updated]
      );
    },
  });

  return {
    setStatus: mutation.mutateAsync,
    isSettingStatus: mutation.isPending,
  };
}
