import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/modules/products/server/actions";
import { getFilesForProduct } from "@/modules/files/server/actions";
import { formatDisplayPrice, createMoney } from "@/lib/money/types";
import { FileUpload } from "@/components/products/file-upload";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const { product } = await getProduct(id);

  if (!product) notFound();

  const files = await getFilesForProduct(product.id);
  const shareUrl = `/p/${product.public_id}`;

  return (
    <main className="flex-1 w-full max-w-[640px] mx-auto px-4 md:px-0 py-16 flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="font-[family-name:var(--font-geist)] text-[32px] md:text-[48px] font-bold text-on-surface leading-tight">
          {product.name}
        </h1>
        <p className="text-[16px] leading-relaxed text-secondary">
          Manage files and settings for your product.
        </p>
      </header>

      {/* Status */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[13px] font-semibold ${
            product.status === "published"
              ? "bg-[#ECFDF5] text-success-green border border-[#D1FAE5]"
              : product.status === "archived"
                ? "bg-surface-container-lowest text-secondary border border-outline-variant"
                : "bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7]"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {product.status === "published"
              ? "check_circle"
              : product.status === "archived"
                ? "archive"
                : "edit_note"}
          </span>
          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
        </span>
        <span className="text-[16px] font-medium text-on-surface">
          {formatDisplayPrice(createMoney(product.price_amount))}
        </span>
      </div>

      {/* Share Link */}
      <div className="bg-surface-studio border border-outline-variant rounded-xl p-6">
        <label className="text-[14px] font-medium text-on-surface block mb-2">
          Share link
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-secondary text-[16px]">
                link
              </span>
            </div>
            <input
              readOnly
              value={shareUrl}
              className="w-full pl-10 pr-4 py-3 bg-surface-bright border border-outline-variant rounded-lg text-[16px] text-on-surface focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo transition-colors font-mono text-sm"
            />
          </div>
          <CopyButton text={shareUrl} />
        </div>
        {/* Quick Share */}
        <div className="mt-4 flex justify-center gap-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-outline-variant bg-surface-studio flex items-center justify-center text-secondary hover:text-green-600 hover:border-green-600 hover:bg-green-50 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              chat
            </span>
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(product.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-outline-variant bg-surface-studio flex items-center justify-center text-secondary hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              send
            </span>
          </a>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-surface-studio border border-outline-variant rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-geist)] text-[18px] font-semibold text-on-surface border-b border-outline-variant pb-2 mb-4">
          Digital Asset {files.length > 0 && `(${files.length})`}
        </h2>
        <FileUpload productId={product.id} existingFiles={files} />
      </div>
    </main>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
      }}
      className="flex-shrink-0 bg-accent-indigo text-white px-6 py-3 rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
    >
      <span className="material-symbols-outlined text-[16px]">content_copy</span>
      Copy
    </button>
  );
}
