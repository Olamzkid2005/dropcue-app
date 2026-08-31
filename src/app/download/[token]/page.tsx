"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface FileInfo {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
}

type PageStatus =
  | "loading"
  | "processing"
  | "ready"
  | "expired"
  | "files_unavailable"
  | "invalid";

interface DeliveryState {
  status: PageStatus;
  product_name?: string;
  files?: FileInfo[];
  expires_at?: string;
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("audio/")) return "audio_file";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "description";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("7z") ||
    mimeType.includes("rar")
  )
    return "folder_zip";
  return "description";
}

function formatExpiry(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DownloadPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<DeliveryState>({ status: "loading" });

  useEffect(() => {
    async function fetchDelivery() {
      try {
        const res = await fetch(`/api/delivery/${token}`);
        const data = await res.json();
        setState({
          status: data.status || "invalid",
          product_name: data.product?.name,
          files: data.files,
          expires_at: data.expires_at,
          error: data.error,
        });
      } catch {
        setState({ status: "invalid", error: "Failed to load" });
      }
    }
    fetchDelivery();
  }, [token]);

  async function handleDownloadFile(fileId: string) {
    window.open(`/api/delivery/${token}/files/${fileId}`, "_blank");
  }

  async function handleDownloadAll() {
    try {
      const res = await fetch(`/api/delivery/${token}/download-all`);
      const data = await res.json();
      if (data.urls) {
        for (const file of data.urls) {
          const link = document.createElement("a");
          link.href = file.url;
          link.download = file.filename;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    } catch { /* silent */ }
  }

  // Loading
  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-accent-indigo border-t-transparent" />
          <p className="text-[14px] text-secondary">Loading your files...</p>
        </div>
      </div>
    );
  }

  // Invalid
  if (state.status === "invalid") {
    return (
      <>
        <header className="w-full h-16 px-6 max-w-[1120px] mx-auto flex items-center justify-start border-b border-outline-variant">
          <img
            src="/logo.png"
            alt="Dropcue"
            className="h-12 w-auto"
          />
        </header>
        <div className="flex flex-grow items-center justify-center px-4">
          <div className="max-w-[560px] w-full bg-surface-studio border border-outline-variant rounded-xl p-8 md:p-16 flex flex-col items-center text-center shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 border border-outline-variant">
              <span className="material-symbols-outlined text-secondary text-[32px]">
                sentiment_dissatisfied
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-geist)] text-[32px] md:text-[48px] font-bold mb-4 text-on-surface">
              Product Not Found
            </h1>
            <p className="text-[18px] leading-relaxed text-secondary mb-8 max-w-md">
              The link may be incorrect, expired, or the product may have been
              removed by the creator.
            </p>
            <Link
              href="/"
              className="bg-accent-indigo text-white px-6 py-3 rounded-lg text-[14px] font-medium hover:opacity-90 transition-colors"
            >
              Return to home
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Expired
  if (state.status === "expired") {
    return (
      <>
        <header className="w-full h-16 px-6 max-w-[1120px] mx-auto flex items-center justify-center border-b border-outline-variant">
          <img
            src="/logo.png"
            alt="Dropcue"
            className="h-12 w-auto"
          />
        </header>
        <div className="flex flex-grow items-center justify-center px-4 py-16">
          <div className="max-w-[560px] w-full bg-surface-studio border border-outline-variant rounded-xl p-8 md:p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 border border-outline-variant">
              <span className="material-symbols-outlined text-secondary text-[32px]">
                timer
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-geist)] text-[32px] md:text-[48px] font-bold mb-2 text-on-surface">
              Link Expired
            </h1>
            <p className="text-[18px] leading-relaxed text-secondary max-w-md mx-auto mb-8">
              For your security, direct download links automatically expire 24
              hours after purchase. You can request a new access link sent
              directly to your email.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <button className="w-full sm:w-auto bg-accent-indigo text-white px-8 py-3.5 rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  mail
                </span>
                Request new link
              </button>
              <button className="w-full sm:w-auto bg-surface-studio text-on-surface border border-outline-variant text-[14px] font-medium px-8 py-3.5 rounded-lg hover:bg-surface-canvas transition-colors">
                Contact support
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Files unavailable
  if (state.status === "files_unavailable") {
    return (
      <>
        <header className="w-full h-16 px-6 max-w-[1120px] mx-auto flex items-center justify-start border-b border-outline-variant">
          <img
            src="/logo.png"
            alt="Dropcue"
            className="h-12 w-auto"
          />
        </header>
        <div className="flex flex-grow items-center justify-center px-4">
          <div className="text-center space-y-4">
            <h1 className="font-[family-name:var(--font-geist)] text-[24px] font-semibold text-on-surface">
              Files unavailable
            </h1>
            <p className="text-secondary">
              These files are no longer available for download. The
              seller&apos;s file-retention period has ended.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Processing
  if (state.status === "processing") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[480px] bg-surface-studio border border-outline-variant rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col items-center text-center">
          <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full text-surface-container-high spin-slow"
              fill="none"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="currentColor"
                strokeDasharray="20 10"
                strokeLinecap="round"
                strokeWidth="4"
              />
            </svg>
            <svg
              className="absolute inset-0 w-full h-full text-accent-indigo animate-spin"
              fill="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M50 4 a46 46 0 0 1 46 46"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="4"
              />
            </svg>
            <span className="material-symbols-outlined text-accent-indigo text-[32px]">
              hourglass_empty
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-geist)] text-[24px] font-semibold text-on-surface mb-2">
            Confirming your payment
          </h1>
          <p className="text-[16px] leading-relaxed text-secondary max-w-sm">
            This usually takes a few seconds. You&apos;ll be able to download
            your files once confirmed.
          </p>
        </div>
      </div>
    );
  }

  // Ready — File Delivery
  return (
    <>
      <header className="w-full h-16 px-6 max-w-[1120px] mx-auto flex items-center justify-start border-b border-outline-variant">
        <img
          src="/logo.png"
          alt="Dropcue"
          className="h-12 w-auto"
        />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center py-16 px-4 md:px-6">
        <div className="w-full max-w-[640px] flex flex-col gap-8">
          {/* Success Header */}
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-success-green text-[32px]">
                check_circle
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-geist)] text-[32px] md:text-[48px] font-bold text-on-surface">
              Your files are ready.
            </h1>
            <p className="text-[18px] leading-relaxed text-secondary">
              Thank you for your purchase. You can download your files below.
            </p>
          </div>

          {/* Product Summary */}
          <div className="bg-surface-studio border border-outline-variant rounded-xl p-4 flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="w-16 h-16 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[24px]">
                audio_file
              </span>
            </div>
            <div className="flex-grow">
              <h2 className="font-[family-name:var(--font-geist)] text-[18px] font-semibold text-on-surface">
                {state.product_name}
              </h2>
              <p className="text-[12px] text-secondary mt-1">
                Premium Digital Assets
              </p>
            </div>
          </div>

          {/* File List */}
          <div className="bg-surface-studio border border-outline-variant rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            {state.files?.map((file, index) => (
              <div
                key={file.id}
                className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-surface-bright transition-colors duration-200 ${
                  index < (state.files?.length ?? 0) - 1
                    ? "border-b border-outline-variant"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-surface-container-low flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-accent-indigo">
                      {getFileIcon(file.mime_type)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-on-surface">
                      {file.original_filename}
                    </p>
                    <p className="text-[12px] text-secondary mt-1">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadFile(file.id)}
                  className="w-full md:w-auto bg-accent-indigo hover:bg-primary-container text-white text-[14px] font-medium px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    download
                  </span>
                  Download
                </button>
              </div>
            ))}
          </div>

          {/* Download All */}
          {(state.files?.length ?? 0) > 1 && (
            <button
              onClick={handleDownloadAll}
              className="w-full bg-surface-studio border border-outline-variant hover:border-accent-indigo text-on-surface py-3 rounded-lg text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                folder_zip
              </span>
              Download all files ({state.files?.length})
            </button>
          )}

          {/* Expiry Notice */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 bg-error-container/30 px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-error-red text-[16px]">
                lock_clock
              </span>
              <p className="text-[13px] font-semibold text-error-red">
                Secure download links expire in 24 hours.
              </p>
            </div>
            {state.expires_at && (
              <p className="text-[12px] text-secondary">
                Expires: {formatExpiry(state.expires_at)}
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
