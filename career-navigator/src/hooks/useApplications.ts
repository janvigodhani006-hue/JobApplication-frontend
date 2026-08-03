/**
 * useApplications.ts
 *
 * TanStack React Query hooks for the Applications resource.
 *
 * Hooks exported:
 *  - useApplications()        → GET  /api/applications  (list)
 *  - useCreateApplication()   → POST /api/applications  (create → saves to DB)
 *  - useUpdateApplication()   → PUT  /api/applications/:id
 *  - useUpdateAppStatus()     → PATCH /api/applications/:id/status (kanban drag-drop)
 *  - useDeleteApplication()   → DELETE /api/applications/:id
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  type ApplicationResponse,
  type ApplicationPayload,
} from "@/lib/api";

// Stable query key — keeps cache consistent across every consumer
export const APPS_QUERY_KEY = ["applications"] as const;

// ─────────────────────────────────────────────────────────────
// READ — load all applications from backend
// ─────────────────────────────────────────────────────────────

/**
 * Fetches the full list of the logged-in user's applications.
 *
 * Usage:
 *   const { apps, isLoading, isError } = useApplications();
 */
export function useApplications() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: APPS_QUERY_KEY,
    queryFn: () => getApplications(),
    staleTime: 2 * 60 * 1000, // treat data as fresh for 2 min
  });

  return {
    /** Flat array of ApplicationResponse objects */
    apps: data?.content ?? [],
    total: data?.totalElements ?? 0,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────
// READ ONE — GET /api/applications/:id
// Used by: Detail drawer in applications.tsx
// ─────────────────────────────────────────────────────────────

/**
 * Fetches a single application by its UUID.
 * Only fires when `id` is provided (enabled guard).
 *
 * Usage:
 *   const { app, isLoading } = useApplicationById(selectedId);
 */
export function useApplicationById(id: string | null) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplicationById(id!),
    enabled: !!id,          // only fetch when an ID is selected
    staleTime: 60 * 1000,   // cache for 1 min
  });

  return { app: data ?? null, isLoading, isError };
}

// ─────────────────────────────────────────────────────────────
// CREATE — POST /api/applications  →  saved in DB
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for creating a new application.
 *
 * On success, automatically refreshes the applications list so
 * the new card appears without a manual page reload.
 *
 * Usage:
 *   const { createApp, isCreating } = useCreateApplication();
 *   await createApp({ company, role, status, location, appliedDate, source, ... });
 */
export function useCreateApplication(options?: {
  onSuccess?: (app: ApplicationResponse) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ApplicationPayload) => createApplication(payload),

    onSuccess: (newApp) => {
      // Optimistically prepend the new application to the cached list
      queryClient.setQueryData<{ content: ApplicationResponse[]; totalElements: number }>(
        APPS_QUERY_KEY,
        (old) =>
          old
            ? {
                ...old,
                content: [newApp, ...old.content],
                totalElements: old.totalElements + 1,
              }
            : { content: [newApp], totalElements: 1 },
      );

      options?.onSuccess?.(newApp);
    },

    onError: (err: Error) => {
      options?.onError?.(err);
    },
  });

  return {
    createApp: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
}

// ─────────────────────────────────────────────────────────────
// UPDATE — PUT /api/applications/:id
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for fully updating an existing application.
 *
 * Usage:
 *   const { updateApp, isUpdating } = useUpdateApplication();
 *   await updateApp({ id: "uuid", payload: { ... } });
 */
export function useUpdateApplication(options?: {
  onSuccess?: (app: ApplicationResponse) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApplicationPayload }) =>
      updateApplication(id, payload),

    onSuccess: (updated) => {
      // Replace the single item in the cached list
      queryClient.setQueryData<{ content: ApplicationResponse[] }>(
        APPS_QUERY_KEY,
        (old) =>
          old
            ? {
                ...old,
                content: old.content.map((a) => (a.id === updated.id ? updated : a)),
              }
            : old,
      );

      options?.onSuccess?.(updated);
    },

    onError: (err: Error) => {
      options?.onError?.(err);
    },
  });

  return {
    updateApp: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}

// ─────────────────────────────────────────────────────────────
// PATCH STATUS — PATCH /api/applications/:id/status
// Used by Kanban board drag-and-drop
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for updating just the status field.
 * Optimistically updates the UI before the server responds.
 *
 * Usage:
 *   const { patchStatus, isPatchingStatus } = useUpdateAppStatus();
 *   await patchStatus({ id: "uuid", status: "interview" });
 */
export function useUpdateAppStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateApplicationStatus(id, status),

    // Optimistic update — move the card in UI immediately
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: APPS_QUERY_KEY });

      const previous = queryClient.getQueryData(APPS_QUERY_KEY);

      queryClient.setQueryData<{ content: ApplicationResponse[] }>(
        APPS_QUERY_KEY,
        (old) =>
          old
            ? {
                ...old,
                content: old.content.map((a) =>
                  a.id === id ? { ...a, status } : a,
                ),
              }
            : old,
      );

      return { previous };
    },

    // Roll back on server error
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(APPS_QUERY_KEY, context.previous);
      }
    },

    // Sync with server's response after success
    onSuccess: (updated) => {
      queryClient.setQueryData<{ content: ApplicationResponse[] }>(
        APPS_QUERY_KEY,
        (old) =>
          old
            ? {
                ...old,
                content: old.content.map((a) => (a.id === updated.id ? updated : a)),
              }
            : old,
      );
    },
  });

  return {
    patchStatus: mutation.mutateAsync,
    isPatchingStatus: mutation.isPending,
  };
}

// ─────────────────────────────────────────────────────────────
// DELETE — DELETE /api/applications/:id
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for deleting an application.
 *
 * Usage:
 *   const { removeApp, isRemoving } = useDeleteApplication();
 *   await removeApp("uuid");
 */
export function useDeleteApplication(options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteApplication(id),

    onSuccess: (_data, id) => {
      queryClient.setQueryData<{ content: ApplicationResponse[]; totalElements: number }>(
        APPS_QUERY_KEY,
        (old) =>
          old
            ? {
                ...old,
                content: old.content.filter((a) => a.id !== id),
                totalElements: Math.max(0, old.totalElements - 1),
              }
            : old,
      );

      options?.onSuccess?.();
    },

    onError: (err: Error) => {
      options?.onError?.(err);
    },
  });

  return {
    removeApp: mutation.mutateAsync,
    isRemoving: mutation.isPending,
    removeError: mutation.error,
  };
}
