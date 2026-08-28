"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/modules/products/server/actions";
import type { CreateProductFormData } from "@/modules/products/validations";

export function CreateProductForm() {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Product name
        </label>
        <input
          id="name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Summer Nights"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe your product..."
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-foreground">
          Price (₦)
        </label>
        <input
          id="price"
          type="number"
          required
          min={100}
          max={10000000}
          step={100}
          value={form.price_amount || ""}
          onChange={(e) =>
            setForm({ ...form, price_amount: Number(e.target.value) })
          }
          placeholder="e.g. 15000"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Minimum ₦100. Creator receives payment minus provider fees.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create product"}
      </button>
    </form>
  );
}
