import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  FileText,
  Download,
  MoreHorizontal,
  Upload,
  Trash2,
  X,
  CloudUpload,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  useResumes,
  useUploadResume,
  useDownloadResume,
  useDeleteResume,
} from "@/hooks/useResumes";

// ─────────────────────────────────────────────────────────────
// Route definition
// ─────────────────────────────────────────────────────────────

export const Route = createFileRoute("/resumes")({
  head: () => ({
    meta: [
      { title: "Resumes · CareerPilot" },
      {
        name: "description",
        content:
          "Version your resumes and track which one gets the most callbacks.",
      },
    ],
  }),
  component: ResumesPage,
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Formats an ISO timestamp into a short relative-ish label */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = ".pdf,.docx";

// ─────────────────────────────────────────────────────────────
// Upload Dialog
// ─────────────────────────────────────────────────────────────

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
}

function UploadDialog({ open, onClose }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset all state every time the dialog is opened so stale
  // errors and files from a previous session don't bleed through.
  useEffect(() => {
    if (open) {
      setFile(null);
      setVersion("");
      setIsDragging(false);
      setFileError(null);
    }
  }, [open]);

  const { upload, isUploading, uploadError } = useUploadResume({
    onSuccess: () => {
      handleClose();
    },
  });

  function handleClose() {
    setFile(null);
    setVersion("");
    setFileError(null);
    onClose();
  }

  function validateAndSet(f: File) {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError("Only PDF and DOCX files are accepted.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileError("File must be smaller than 10 MB.");
      return;
    }
    setFileError(null);
    setFile(f);
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    await upload({ file, version: version.trim() || file.name });
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-dialog-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card ring-1 ring-border shadow-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              id="upload-dialog-title"
              className="text-base font-semibold"
            >
              Upload Resume
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF or DOCX · max 10 MB
            </p>
          </div>
          <button
            id="upload-dialog-close"
            onClick={handleClose}
            className="size-7 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close upload dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            id="resume-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3
              rounded-xl border-2 border-dashed p-8 cursor-pointer
              transition-all duration-200 select-none
              ${isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-border hover:border-primary/50 hover:bg-accent/40"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) validateAndSet(f);
              }}
            />

            {file ? (
              <>
                <CheckCircle className="size-8 text-emerald-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-emerald-400 truncate max-w-[220px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(file.size / 1024).toFixed(0)} KB · Click to change
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="size-12 rounded-xl bg-primary/10 grid place-items-center">
                  <CloudUpload className="size-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Drop your resume here
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    or click to browse files
                  </p>
                </div>
              </>
            )}
          </div>

          {/* File validation error */}
          {fileError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {fileError}
            </div>
          )}

          {/* Version label */}
          <div>
            <label
              htmlFor="resume-version-input"
              className="text-xs font-medium text-muted-foreground block mb-1.5"
            >
              Version label
              <span className="text-muted-foreground/60 font-normal ml-1">
                (optional)
              </span>
            </label>
            <input
              id="resume-version-input"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. Frontend_Specialist_v2"
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* API error */}
          {uploadError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {uploadError.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              id="upload-dialog-cancel"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              id="upload-dialog-submit"
              type="submit"
              disabled={!file || isUploading}
              className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium inline-flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[var(--shadow-glow)]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton card (loading state)
// ─────────────────────────────────────────────────────────────

function ResumeCardSkeleton() {
  return (
    <div className="bg-card rounded-xl ring-1 ring-border p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="size-10 rounded-lg bg-accent" />
        <div className="size-4 rounded bg-accent w-4" />
      </div>
      <div className="h-3 bg-accent rounded w-3/4 mb-2" />
      <div className="h-2.5 bg-accent rounded w-1/2" />
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <div>
          <div className="h-5 bg-accent rounded w-8 mb-1" />
          <div className="h-2.5 bg-accent rounded w-20" />
        </div>
        <div className="size-9 rounded-md bg-accent" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mb-4">
        <FileText className="size-8 text-primary" />
      </div>
      <h3 className="text-base font-semibold mb-1">No resumes yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">
        Upload your first resume to start tracking which version earns the
        most callbacks.
      </p>
      <button
        id="resumes-empty-upload-btn"
        onClick={onUpload}
        className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg inline-flex items-center gap-2 hover:brightness-110 transition-all shadow-[var(--shadow-glow)]"
      >
        <Upload className="size-4" />
        Upload your first resume
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

function ResumesPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { resumes, isLoading, isError, error } = useResumes();
  const { download, isDownloading } = useDownloadResume();
  const { removeResume, isRemoving } = useDeleteResume();

  return (
    <>
      <AppShell
        title="Resumes"
        subtitle="Keep multiple versions and track which one performs best with recruiters."
        action={
          <button
            id="resumes-upload-btn"
            onClick={() => setUploadOpen(true)}
            className="bg-primary text-primary-foreground text-sm font-medium px-3.5 py-2 rounded-md inline-flex items-center gap-1.5 hover:brightness-110 transition-all shadow-[var(--shadow-glow)]"
          >
            <Upload className="size-4" />
            Upload resume
          </button>
        }
      >
        {/* Error banner */}
        {isError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error instanceof Error
              ? error.message
              : "Failed to load resumes. Please refresh."}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Loading skeletons */}
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <ResumeCardSkeleton key={i} />
            ))}

          {/* Empty state */}
          {!isLoading && !isError && resumes.length === 0 && (
            <EmptyState onUpload={() => setUploadOpen(true)} />
          )}

          {/* Resume cards */}
          {resumes.map((r) => (
            <article
              key={r.id}
              className="relative bg-card rounded-xl ring-1 ring-border p-5 hover:ring-white/20 transition-all group"
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className="size-10 rounded-lg bg-accent grid place-items-center">
                  <FileText className="size-5 text-primary" />
                </div>

                {/* MoreHorizontal menu */}
                <div className="relative">
                  <button
                    id={`resume-menu-btn-${r.id}`}
                    aria-label="More options"
                    onClick={() =>
                      setMenuOpenId(menuOpenId === r.id ? null : r.id)
                    }
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>

                  {menuOpenId === r.id && (
                    <>
                      {/* Click-away backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-6 z-20 w-36 rounded-lg bg-popover border border-border shadow-xl py-1 text-sm">
                        <button
                          id={`resume-delete-btn-${r.id}`}
                          disabled={isRemoving}
                          onClick={async () => {
                            setMenuOpenId(null);
                            await removeResume(r.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* File info */}
              <h3 className="text-sm font-medium truncate">{r.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {r.version} · {r.fileSize} · {formatDate(r.createdAt)}
              </p>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold tabular-nums">
                    {r.applicationCount}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    applications used
                  </p>
                </div>

                {/* Download button */}
                <button
                  id={`resume-download-btn-${r.id}`}
                  aria-label={`Download ${r.name}`}
                  disabled={isDownloading}
                  onClick={() =>
                    download({ id: r.id, fileName: r.name })
                  }
                  className="size-9 rounded-md border border-border grid place-items-center hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      </AppShell>

      {/* Upload Dialog */}
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}
