"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/modules/products/server/actions";
import type { CreateProductFormData } from "@/modules/products/validations";

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductFormData>({
    name: "",
    description: "",
    price_amount: 0,
    currency: "NGN",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createProduct({
      name: form.name,
      description: form.description || undefined,
      price_amount: form.price_amount,
      currency: "NGN",
    });

    if (result.success && result.product) {
      router.push(`/products/${result.product.id}`);
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 w-full max-w-[640px] mx-auto px-4 md:px-0 py-16 flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="font-[family-name:var(--font-geist)] text-[32px] md:text-[48px] font-bold text-on-surface leading-tight">
          New Product
        </h1>
        <p className="text-[16px] leading-relaxed text-secondary">
          Set up the details for your new digital offering.
        </p>
      </header>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 bg-surface-studio border border-outline-variant rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
      >
        {/* Basic Details */}
        <section className="flex flex-col gap-4">
          <h2 className="font-[family-name:var(--font-geist)] text-[18px] font-semibold text-on-surface border-b border-outline-variant pb-2">
            Basic Information
          </h2>
          <div className="space-y-2">
            <label
              htmlFor="productName"
              className="text-[14px] font-medium text-on-surface flex items-center gap-1"
            >
              Product Name{" "}
              <span className="text-error-red">*</span>
            </label>
            <input
              id="productName"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Masterclass Presets Vol. 1"
              className="input-base"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-[14px] font-medium text-on-surface"
            >
              Description{" "}
              <span className="text-secondary font-normal">(Optional)</span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Briefly describe what's included..."
              className="flex w-full rounded-md border border-outline-variant bg-surface-studio px-3 py-2 text-sm ring-offset-surface-canvas placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2 resize-y min-h-[100px]"
            />
          </div>
        </section>

        {/* Pricing */}
        <section className="flex flex-col gap-4">
          <h2 className="font-[family-name:var(--font-geist)] text-[18px] font-semibold text-on-surface border-b border-outline-variant pb-2">
            Pricing
          </h2>
          <div className="space-y-2 max-w-[200px]">
            <label
              htmlFor="price"
              className="text-[14px] font-medium text-on-surface flex items-center gap-1"
            >
              Amount <span className="text-error-red">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-secondary text-[16px]">₦</span>
              </div>
              <input
                id="price"
                type="number"
                required
                min={100}
                max={10000000}
                step={100}
                value={form.price_amount || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price_amount: Number(e.target.value),
                  })
                }
                placeholder="0.00"
                className="input-base pl-8"
              />
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-error-container/50 border border-error-red/30 rounded-lg p-3 text-[14px] text-error-red">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {isSubmitting ? "Creating..." : "Publish Product"}
          </button>
        </div>
      </form>
    </main>
  );
}
