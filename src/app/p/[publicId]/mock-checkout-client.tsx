"use client";

import { useState } from "react";

interface CheckoutClientProps {
  productId: string;
  productName: string;
  price: string;
}

export function MockCheckoutClient({
  productId,
  price,
}: CheckoutClientProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/checkout/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_email: email,
          payment_provider: "bachs",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Checkout failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // If checkout_url is returned, redirect to payment provider
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      // Never claim payment succeeded without a provider checkout URL.
      setStatus("error");
      setError("Payment checkout is temporarily unavailable. Please try again later.");
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-6 animate-in fade-in duration-300">
        <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-green-600 text-3xl">
            check_circle
          </span>
        </div>
        <p className="font-semibold text-[#141416] mb-1">Payment confirmed!</p>
        <p className="text-sm text-[#6e6e73]">
          Check your email for the download link.
        </p>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="text-center py-6">
        <div className="w-10 h-10 border-3 border-[#4338CA] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6e6e73]">Processing payment...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#141416] block">
          Email address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-white text-[#141416] text-[14px] placeholder:text-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:border-transparent transition-colors"
        />
        <p className="text-xs text-[#6e6e73]">
          Your download link will be sent here.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 bg-[#4338CA] text-white rounded-xl text-[14px] font-semibold hover:bg-[#3730A3] transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">
          shopping_cart
        </span>
        Buy {price}
      </button>

      <div className="flex items-center justify-center gap-4 pt-2">
        <span className="flex items-center gap-1.5 text-xs text-[#6e6e73]">
          <span className="material-symbols-outlined text-[#4338CA] text-sm">
            lock
          </span>
          Secure checkout
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#6e6e73]">
          <span className="material-symbols-outlined text-[#4338CA] text-sm">
            bolt
          </span>
          Instant delivery
        </span>
      </div>
    </form>
  );
}
