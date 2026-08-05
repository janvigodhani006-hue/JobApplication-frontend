/**
 * useResumes.ts
 *
 * TanStack React Query hooks for the Resumes resource.
 *
 * Hooks exported:
 *  - useResumes()         → GET    /api/resumes
 *  - useUploadResume()    → POST   /api/resumes  (multipart/form-data)
 *  - useDeleteResume()    → DELETE /api/resumes/:id
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getResumes,
  uploadResume,
  downloadResume,
  deleteResume,
  type ResumeResponse,
} from "@/lib/resume-api";

// Stable query key — keeps cache consistent across every consumer
export const RESUMES_QUERY_KEY = ["resumes"] as const;

// ─────────────────────────────────────────────────────────────
// READ — GET /api/resumes
// ─────────────────────────────────────────────────────────────

/**
 * Fetches all resume versions for the logged-in user.
 *
 * Usage:
 *   const { resumes, isLoading, isError } = useResumes();
 */
export function useResumes() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: RESUMES_QUERY_KEY,
    queryFn: getResumes,
    staleTime: 2 * 60 * 1000, // treat data as fresh for 2 min
  });

  return {
    resumes: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────
// UPLOAD — POST /api/resumes (multipart/form-data)
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for uploading a new resume file.
 * Optimistically prepends the new resume to the cached list,
 * then replaces with the real server response.
 *
 * Usage:
 *   const { upload, isUploading, uploadError } = useUploadResume();
 *   await upload({ file, version: "Frontend_v2" });
 */
export function useUploadResume(options?: {
  onSuccess?: (resume: ResumeResponse) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ file, version }: { file: File; version: string }) =>
      uploadResume(file, version),

    onSuccess: (newResume) => {
      // Prepend new resume to the top of the cached list
      queryClient.setQueryData<ResumeResponse[]>(
        RESUMES_QUERY_KEY,
        (old) => (old ? [newResume, ...old] : [newResume])
      );
      options?.onSuccess?.(newResume);
    },

    onError: (err: Error) => {
      options?.onError?.(err);
    },
  });

  return {
    upload: mutation.mutateAsync,
    isUploading: mutation.isPending,
    uploadError: mutation.error as Error | null,
  };
}

// ─────────────────────────────────────────────────────────────
// DOWNLOAD — GET /api/resumes/:id/download
// ─────────────────────────────────────────────────────────────

/**
 * Returns a download function that fetches the binary file and
 * triggers a browser Save-As dialog. No cache invalidation needed.
 *
 * Usage:
 *   const { download, isDownloading } = useDownloadResume();
 *   await download({ id: "uuid", fileName: "Jane_Doe_Resume.pdf" });
 */
export function useDownloadResume() {
  const mutation = useMutation({
    mutationFn: ({ id, fileName }: { id: string; fileName: string }) =>
      downloadResume(id, fileName),
  });

  return {
    download: mutation.mutateAsync,
    isDownloading: mutation.isPending,
    downloadError: mutation.error as Error | null,
  };
}

// ─────────────────────────────────────────────────────────────
// DELETE — DELETE /api/resumes/:id
// ─────────────────────────────────────────────────────────────

/**
 * Mutation hook for deleting a resume.
 * Optimistically removes the card from the UI immediately.
 *
 * Usage:
 *   const { removeResume, isRemoving } = useDeleteResume();
 *   await removeResume("uuid");
 */
export function useDeleteResume(options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteResume(id),

    // Optimistic update — remove card from UI immediately
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: RESUMES_QUERY_KEY });
      const previous =
        queryClient.getQueryData<ResumeResponse[]>(RESUMES_QUERY_KEY);

      queryClient.setQueryData<ResumeResponse[]>(
        RESUMES_QUERY_KEY,
        (old) => (old ? old.filter((r) => r.id !== id) : [])
      );

      return { previous };
    },

    // Roll back on server error
    onError: (err: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(RESUMES_QUERY_KEY, context.previous);
      }
      options?.onError?.(err);
    },

    onSuccess: () => {
      options?.onSuccess?.();
    },
  });

  return {
    removeResume: mutation.mutateAsync,
    isRemoving: mutation.isPending,
    removeError: mutation.error as Error | null,
  };
}
