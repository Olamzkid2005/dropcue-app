"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_MIME_TYPES, FILE_LIMITS } from "@/modules/files/types";

interface UploadState {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completing" | "done" | "error";
  error?: string;
  file_id?: string;
}

interface FileUploadProps {
  productId: string;
  existingFiles: Array<{
    id: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    status: string;
  }>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("zip") || mimeType.includes("7z") || mimeType.includes("rar"))
    return "📦";
  return "📄";
}

export function FileUpload({
  productId,
  existingFiles,
}: FileUploadProps) {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return `File type "${file.type || "unknown"}" is not allowed`;
    }
    if (file.size > FILE_LIMITS.maxFileSize) {
      return `File exceeds ${FILE_LIMITS.maxFileSize / 1024 / 1024} MB limit`;
    }
    const totalExisting = existingFiles.reduce((s, f) => s + f.file_size, 0);
    const totalNew = uploads.reduce((s, u) => s + u.file.size, 0);
    if (totalExisting + totalNew + file.size > FILE_LIMITS.maxTotalProductSize) {
      return "Total product size would exceed 2 GB";
    }
    return null;
  }, [existingFiles, uploads]);

  const uploadFile = useCallback(
    async (state: UploadState, index: number) => {
      const updateState = (patch: Partial<UploadState>) => {
        setUploads((prev) =>
          prev.map((u, i) => (i === index ? { ...u, ...patch } : u))
        );
      };

      try {
        // Step 1: Get signed upload URL
        updateState({ status: "uploading", progress: 10 });

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: productId,
            file_name: state.file.name,
            file_size: state.file.size,
            content_type: state.file.type,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          updateState({ status: "error", error: data.error || "Upload failed" });
          return;
        }

        updateState({ progress: 20, file_id: data.file_id });

        // Step 2: Upload file directly to Supabase Storage
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 70) + 20; // 20-90%
            updateState({ progress: pct });
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.open("PUT", data.upload_url);
          xhr.setRequestHeader("Content-Type", state.file.type);
          xhr.send(state.file);
        });

        // Step 3: Mark upload complete
        updateState({ status: "completing", progress: 95 });

        const completeRes = await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_id: data.file_id,
            product_id: productId,
          }),
        });

        if (!completeRes.ok) {
          const completeData = await completeRes.json();
          throw new Error(completeData.error || "Failed to complete upload");
        }

        updateState({ status: "done", progress: 100 });
        router.refresh();
      } catch (err) {
        updateState({
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    },
    [productId, router]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const newUploads: UploadState[] = [];

      for (const file of Array.from(files)) {
        const error = validateFile(file);
        if (error) {
          newUploads.push({ file, progress: 0, status: "error", error });
        } else {
          newUploads.push({ file, progress: 0, status: "pending" });
        }
      }

      setUploads((prev) => [...prev, ...newUploads]);

      // Start uploading non-error files
      newUploads.forEach((upload, i) => {
        if (upload.status === "pending") {
          const globalIndex = uploads.length + i;
          uploadFile(upload, globalIndex);
        }
      });
    },
    [validateFile, uploadFile, uploads.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      if (!confirm("Delete this file?")) return;
      setDeleting(fileId);

      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
      setDeleting(null);
    },
    [router]
  );

  const completedCount = uploads.filter(
    (u) => u.status === "done"
  ).length;
  const activeUploads = uploads.filter(
    (u) => u.status === "uploading" || u.status === "completing" || u.status === "pending"
  );

  return (
    <div className="space-y-4">
      {/* Existing files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span>{getFileTypeIcon(file.mime_type)}</span>
                <span className="truncate text-sm font-medium text-foreground">
                  {file.original_filename}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.file_size)}
                </span>
                {file.status === "uploaded" && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                    ✓
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                disabled={deleting === file.id}
                className="ml-2 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                {deleting === file.id ? "..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground"
        }`}
      >
        <svg
          className="mb-2 h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm font-medium text-foreground">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Audio, images, PDF, ZIP · Max {FILE_LIMITS.maxFileSize / 1024 / 1024} MB per
          file · Max {FILE_LIMITS.maxFilesPerProduct} files
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_MIME_TYPES.join(",")}
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
        className="hidden"
      />

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, i) => (
            <div
              key={`${upload.file.name}-${i}`}
              className="rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span>{getFileTypeIcon(upload.file.type)}</span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {upload.file.name}
                  </span>
                </div>
                <span className="ml-2 text-xs text-muted-foreground">
                  {upload.status === "done"
                    ? "✓ Done"
                    : upload.status === "error"
                      ? "✗ Failed"
                      : upload.status === "completing"
                        ? "Saving..."
                        : `${upload.progress}%`}
                </span>
              </div>
              {upload.status === "uploading" && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              {upload.error && (
                <p className="mt-1 text-xs text-destructive">{upload.error}</p>
              )}
            </div>
          ))}
          {activeUploads.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Uploading {activeUploads.length} file
              {activeUploads.length !== 1 ? "s" : ""}...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
