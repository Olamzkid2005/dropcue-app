"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteProduct } from "@/modules/products/server/actions";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  status: string;
  public_id: string;
  created_at: string;
}

function formatNaira(amountInKobo: number): string {
  const naira = amountInKobo / 100;
  return `\u20A6${naira.toLocaleString("en-NG")}`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function ProductActions({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-9 h-9 rounded-lg border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/20 transition-all"
      >
        <i className="fa-solid fa-ellipsis" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-xl shadow-jumbo border border-hairline py-1.5 z-50 animate-zoom-in">
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink hover:bg-hairline/50 transition-colors"
          >
            <i className="fa-solid fa-pen-to-square w-4 text-center text-muted" />
            Edit Product
          </Link>
          <a
            href={`/p/${product.public_id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink hover:bg-hairline/50 transition-colors"
          >
            <i className="fa-solid fa-arrow-up-right-from-square w-4 text-center text-muted" />
            View Public Page
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete(product);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <i className="fa-solid fa-trash-can w-4 text-center" />
            Delete Product
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePermanently, setDeletePermanently] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      setProducts((data ?? []) as Product[]);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteProduct(deleteTarget.id, deletePermanently);
    if (result.success) {
      setProducts((prev) => prev.map((p) =>
        p.id === deleteTarget.id ? { ...p, status: "archived" } : p
      ));
    }
    setIsDeleting(false);
    setDeleteTarget(null);
    setDeletePermanently(false);
  }

  const filtered = filter === "all" ? products : products.filter((p) => p.status === filter);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
        <div className="flex items-center justify-between h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
          <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">Products</h1>
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink/90 transition-all duration-200 active:scale-[0.98]"
          >
            <i className="fa-solid fa-plus text-xs" />
            <span className="hidden sm:inline">New Product</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 lg:p-10 max-w-[1200px] mx-auto w-full flex flex-col gap-6">
        {/* Filters */}
        <div className="flex items-center gap-2">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? "bg-ink text-white"
                  : "bg-surface border border-hairline text-muted hover:text-ink hover:border-ink/20"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "all" && ` (${products.length})`}
              {f === "published" && ` (${products.filter((p) => p.status === "published").length})`}
              {f === "draft" && ` (${products.filter((p) => p.status === "draft").length})`}
            </button>
          ))}
        </div>

        {/* Products List */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface p-6 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-hairline rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-hairline rounded w-48" />
                    <div className="h-4 bg-hairline rounded w-32" />
                  </div>
                  <div className="h-5 bg-hairline rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-16 text-center">
            <div className="w-20 h-20 bg-hairline/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-box-open text-3xl text-muted" />
            </div>
            <h3 className="text-xl font-semibold font-[family-name:var(--font-geist)] mb-2">
              {filter === "all" ? "No products yet" : `No ${filter} products`}
            </h3>
            <p className="text-muted mb-6 max-w-sm mx-auto">
              {filter === "all"
                ? "Upload your first digital product to start selling. It takes less than a minute."
                : `You don't have any ${filter} products.`}
            </p>
            {filter === "all" && (
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-2 bg-ink text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-ink/90 transition-all"
              >
                <i className="fa-solid fa-cloud-arrow-up" />
                Upload Product
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((product) => (
              <Link
                key={product.id}
                href={`/dashboard/products/${product.id}/edit`}
                className="group bg-surface p-5 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline hover:shadow-jumbo hover:border-ink/15 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {/* Product icon */}
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <i className="fa-solid fa-music text-accent" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-medium truncate">{product.name}</h3>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          product.status === "published"
                            ? "bg-green-50 text-green-700"
                            : product.status === "archived"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-hairline text-muted"
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate">
                      {product.description || "No description"} · Created {timeAgo(product.created_at)}
                    </p>
                  </div>

                  {/* Price + actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-semibold">{formatNaira(product.price_amount)}</span>
                    <ProductActions
                      product={product}
                      onDelete={(p) => setDeleteTarget(p)}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteTarget(null)} />
          <div className="relative bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-8 max-w-[400px] w-full animate-zoom-in">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-center font-[family-name:var(--font-geist)] mb-2">
              Delete Product?
            </h3>
            <p className="text-sm text-muted text-center mb-6">
              {deletePermanently
                ? <>This permanently deletes <strong>{deleteTarget.name}</strong>. This is only available if it has no orders.</>
                : <>This will archive <strong>{deleteTarget.name}</strong> and hide it from buyers. Existing orders and download history will be preserved.</>}
            </p>
            <label className="flex items-start gap-3 mb-6 text-sm text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={deletePermanently}
                onChange={(e) => setDeletePermanently(e.target.checked)}
                disabled={isDeleting}
                className="mt-0.5 rounded border-hairline text-red-600 focus:ring-red-500"
              />
              <span><strong className="text-red-600">Permanently delete</strong> instead of archive. This will fail if the product has orders.</span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-hairline rounded-xl text-sm font-medium hover:bg-hairline/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2.5 ${deletePermanently ? "bg-red-700 hover:bg-red-800" : "bg-red-600 hover:bg-red-700"} text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2`}

              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-xs" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
