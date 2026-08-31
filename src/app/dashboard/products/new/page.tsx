"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/modules/products/server/actions";

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_amount: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await createProduct({
      name: form.name,
      description: form.description || undefined,
      price_amount: Number(form.price_amount),
    });

    if (result.success && result.product) {
      router.push(`/dashboard/products/${result.product.id}/edit`);
      return;
    }

    setError(result.error ?? "Failed to create product");
    setIsSubmitting(false);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
        <div className="flex items-center h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
          <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">
            New Product
          </h1>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-10 max-w-[640px] mx-auto w-full flex flex-col gap-8">
        <p className="text-muted">
          Add the product details first. You&apos;ll upload the files on the next screen.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation" />
              {error}
            </div>
          )}

          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-geist)] mb-5">
              Basic Information
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="productName" className="text-sm font-medium flex items-center gap-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="productName"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Summer Nights Beat"
                  className="w-full h-11 px-4 rounded-lg border border-hairline bg-surface text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-muted font-normal">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Briefly describe what&apos;s included..."
                  className="w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y min-h-[100px] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-geist)] mb-5">
              Pricing
            </h2>
            <div className="space-y-2 max-w-[220px]">
              <label htmlFor="price" className="text-sm font-medium flex items-center gap-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted text-sm pointer-events-none">
                  ₦
                </span>
                <input
                  id="price"
                  type="number"
                  required
                  min={100}
                  max={10000000}
                  step={100}
                  value={form.price_amount}
                  onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
                  placeholder="15000"
                  className="w-full h-11 pl-8 pr-4 rounded-lg border border-hairline bg-surface text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>
              <p className="text-xs text-muted">
                Minimum ₦100. You receive payment minus provider fees.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-hairline rounded-xl text-sm font-medium hover:bg-hairline/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs" />
                  Creating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-arrow-right text-xs" />
                  Continue to Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
