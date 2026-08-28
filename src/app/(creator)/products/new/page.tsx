"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_amount: 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock creation - simulate API call
    await new Promise((r) => setTimeout(r, 1500));

    const mockId = `mock-${Date.now()}`;
    setCreatedProduct({ id: mockId, name: form.name });
    setSuccess(true);
    setIsSubmitting(false);
  }

  if (success && createdProduct) {
    return (
      <AppLayout>
        <main className="flex-1 w-full max-w-[640px] mx-auto px-4 md:px-0 py-16 flex flex-col gap-8">
          {/* Success State */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">
                check_circle
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#141416] mb-2">Product Published!</h2>
            <p className="text-[#6e6e73] mb-6">
              Your digital product is live and ready to sell.
            </p>

            {/* Product Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#4338CA]/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#4338CA]">
                      audio_file
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-[#141416]">{createdProduct.name}</p>
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Active
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-[#141416]">
                  ₦{form.price_amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Share Link */}
            <div className="mb-6">
              <p className="text-sm text-[#6e6e73] mb-2 text-left">Your share link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://dropcue.co/p/${createdProduct.id}`}
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-[#6e6e73] font-mono"
                />
                <button className="bg-[#4338CA] hover:bg-[#3730A3] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy Link
                </button>
              </div>
            </div>

            {/* Quick Share */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-[#6e6e73] uppercase tracking-wider mb-3">Quick Share</p>
              <div className="flex justify-center gap-3">
                {["X", "WhatsApp", "Telegram", "Email"].map((platform) => (
                  <button
                    key={platform}
                    className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                    title={`Share on ${platform}`}
                  >
                    <span className="material-symbols-outlined text-gray-600 text-lg">
                      {platform === "X" ? "tag" : platform === "WhatsApp" ? "chat" : platform === "Telegram" ? "send" : "email"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-[#4338CA] hover:bg-[#3730A3] text-white py-3 rounded-lg text-[14px] font-medium transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setCreatedProduct(null);
                  setForm({ name: "", description: "", price_amount: 0 });
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-[#141416] py-3 rounded-lg text-[14px] font-medium transition-colors"
              >
                Create Another Product
              </button>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 w-full max-w-[640px] mx-auto px-4 md:px-0 py-16 flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-[32px] md:text-[40px] font-bold text-[#141416] leading-tight">
            New Product
          </h1>
          <p className="text-[16px] leading-relaxed text-[#6e6e73]">
            Set up the details for your new digital offering.
          </p>
        </header>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          {/* Basic Details */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[18px] font-semibold text-[#141416] border-b border-gray-200 pb-2">
              Basic Information
            </h2>
            <div className="space-y-2">
              <label
                htmlFor="productName"
                className="text-[14px] font-medium text-[#141416] flex items-center gap-1"
              >
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="productName"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Summer Nights Beat"
                className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-white text-[#141416] text-[14px] placeholder:text-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:border-transparent transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-[14px] font-medium text-[#141416]"
              >
                Description <span className="text-[#6e6e73] font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe what's included..."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[14px] placeholder:text-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:border-transparent resize-y min-h-[100px] transition-colors"
              />
            </div>
          </section>

          {/* Pricing */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[18px] font-semibold text-[#141416] border-b border-gray-200 pb-2">
              Pricing
            </h2>
            <div className="space-y-2 max-w-[200px]">
              <label
                htmlFor="price"
                className="text-[14px] font-medium text-[#141416] flex items-center gap-1"
              >
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-[#6e6e73] text-[16px]">₦</span>
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
                    setForm({ ...form, price_amount: Number(e.target.value) })
                  }
                  placeholder="0"
                  className="w-full h-11 pl-8 pr-4 rounded-lg border border-gray-200 bg-white text-[#141416] text-[14px] placeholder:text-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:border-transparent transition-colors"
                />
              </div>
              <p className="text-xs text-[#6e6e73]">
                Minimum ₦100. You receive payment minus provider fees.
              </p>
            </div>
          </section>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium text-[#141416] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#4338CA] text-white rounded-lg text-[14px] font-medium hover:bg-[#3730A3] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {isSubmitting ? "Publishing..." : "Publish Product"}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}
