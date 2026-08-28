"use client";

import { useState } from "react";

interface CheckoutFormProps {
  productId: string;
  productName: string;
}

export function CheckoutForm({ productId, productName }: CheckoutFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/checkout/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_email: email,
          payment_provider: "korapay",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setIsSubmitting(false);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-auto">
      <div className="space-y-2">
        <label
          htmlFor="buyer-email"
          className="text-[14px] font-medium text-on-surface block"
        >
          Email address
        </label>
        <input
          id="buyer-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-base"
        />
        <p className="text-[12px] text-secondary">
          Your download link will be sent here.
        </p>
      </div>

      {error && (
        <div className="bg-error-container/50 border border-error-red/30 rounded-lg p-3 text-[14px] text-error-red">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-accent-indigo text-on-primary text-[14px] font-medium py-4 rounded-xl hover:bg-primary-container transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[20px]">
          shopping_cart_checkout
        </span>
        {isSubmitting ? "Redirecting..." : `Buy ${productName}`}
      </button>
    </form>
  );
}
