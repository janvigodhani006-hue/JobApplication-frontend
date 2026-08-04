/**
 * useInterviews.ts
 *
 * TanStack React Query hooks for the Interviews resource.
 *
 * Hooks exported:
 *  - useInterviews()          → GET    /api/interviews
 *  - useCreateInterview()     → POST   /api/interviews
 *  - useUpdateInterview()     → PUT    /api/interviews/:id
 *  - useMarkInterviewComplete()→ PATCH  /api/interviews/:id/complete
 *  - useDeleteInterview()     → DELETE /api/interviews/:id
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInterviews,
  createInterview,
  updateInterview,
  markInterviewComplete,
  deleteInterview,
  type InterviewResponse,
  type InterviewPayload,
} from "@/lib/interview-api";

// Stable query key — keeps cache consistent across every consumer
export const INTERVIEWS_QUERY_KEY = ["interviews"] as const;

// ─────────────────────────────────────────────────────────────
// READ — GET /api/interviews
// ─────────────────────────────────────────────────────────────

/**
 * Fetches all interviews for the logged-in user.
 *
 * Usage:
 *   const { interviews, upcoming, past, isLoading } = useInterviews();
 */
export function useInterviews() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: INTERVIEWS_QUERY_KEY,
    queryFn: getInterviews,
    staleTime: 2 * 60 * 1000, // treat data as fresh for 2 min
  });

  const now = new Date();
  const all = data ?? [];

  return {
    /** All interviews (completed + upcoming) */
    interviews: all,
    /** Upcoming: not completed AND interviewDate is in the future */
    upcoming: all.filter(
      (i) => !i.isCompleted && new Date(i.interviewDate) >= now
    ),
    /** Past: completed OR interviewDate already passed */
    past: all.filter(
      (i) => i.isCompleted || new Date(i.interviewDate) < now
    ),
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────
// CREATE — POST /api/interviews
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for scheduling a new interview.
 * Optimistically prepends the new interview to the cached list.
 *
 * Usage:
 *   const { schedule, isScheduling } = useCreateInterview();
 *   await schedule({ company, role, type, interviewDate, platform, prepNotes });
 */
export function useCreateInterview(options?: {
  onSuccess?: (interview: InterviewResponse) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: InterviewPayload) => createInterview(payload),

    onSuccess: (newInterview) => {
      // Prepend new interview to cached list
      queryClient.setQueryData<InterviewResponse[]>(
        INTERVIEWS_QUERY_KEY,
        (old) => (old ? [newInterview, ...old] : [newInterview])
      );
      options?.onSuccess?.(newInterview);
    },

    onError: (err: Error) => {
      options?.onError?.(err);
    },
  });

  return {
    schedule: mutation.mutateAsync,
    isScheduling: mutation.isPending,
    scheduleError: mutation.error,
  };
}

// ─────────────────────────────────────────────────────────────
// UPDATE — PUT /api/interviews/:id
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for fully updating an existing interview.
 *
 * Usage:
 *   const { editInterview, isEditing } = useUpdateInterview();
 *   await editInterview({ id: "uuid", payload: { ... } });
 */
export function useUpdateInterview(options?: {
  onSuccess?: (interview: InterviewResponse) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<InterviewPayload>;
    }) => updateInterview(id, payload),

    onSuccess: (updated) => {
      // Replace the updated interview in cache
      queryClient.setQueryData<InterviewResponse[]>(
        INTERVIEWS_QUERY_KEY,
        (old) =>
          old
            ? old.map((i) => (i.id === updated.id ? updated : i))
            : [updated]
      );
      options?.onSuccess?.(updated);
    },

    onError: (err: Error) => {
      options?.onError?.(err);
    },
  });

  return {
    editInterview: mutation.mutateAsync,
    isEditing: mutation.isPending,
    editError: mutation.error,
  };
}

// ─────────────────────────────────────────────────────────────
// MARK COMPLETE — PATCH /api/interviews/:id/complete
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for toggling an interview to completed.
 * Optimistically updates the card in the UI immediately.
 *
 * Usage:
 *   const { complete, isCompleting } = useMarkInterviewComplete();
 *   await complete("uuid");
 */
export function useMarkInterviewComplete() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => markInterviewComplete(id),

    // Optimistic update — flip isCompleted immediately
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: INTERVIEWS_QUERY_KEY });
      const previous = queryClient.getQueryData<InterviewResponse[]>(INTERVIEWS_QUERY_KEY);

      queryClient.setQueryData<InterviewResponse[]>(
        INTERVIEWS_QUERY_KEY,
        (old) =>
          old
            ? old.map((i) =>
                i.id === id ? { ...i, isCompleted: true } : i
              )
            : old
      );

      return { previous };
    },

    // Roll back on server error
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(INTERVIEWS_QUERY_KEY, context.previous);
      }
    },

    // Sync server response into cache
    onSuccess: (updated) => {
      queryClient.setQueryData<InterviewResponse[]>(
        INTERVIEWS_QUERY_KEY,
        (old) =>
          old ? old.map((i) => (i.id === updated.id ? updated : i)) : [updated]
      );
    },
  });

  return {
    complete: mutation.mutateAsync,
    isCompleting: mutation.isPending,
  };
}

// ─────────────────────────────────────────────────────────────
// DELETE — DELETE /api/interviews/:id
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for deleting an interview round.
 *
 * Usage:
 *   const { removeInterview, isRemoving } = useDeleteInterview();
 *   await removeInterview("uuid");
 */
export function useDeleteInterview(options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteInterview(id),

    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.setQueryData<InterviewResponse[]>(
        INTERVIEWS_QUERY_KEY,
        (old) => (old ? old.filter((i) => i.id !== id) : [])
      );
      options?.onSuccess?.();
    },

    onError: (err: Error) => {
      options?.onError?.(err);
    },
  });

  return {
    removeInterview: mutation.mutateAsync,
    isRemoving: mutation.isPending,
    removeError: mutation.error,
  };
}
