"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type OrderStatus = "pending" | "paid" | "failed";

interface OrderState {
  status: OrderStatus;
  delivery_token: string | null;
  product_name: string | null;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [state, setState] = useState<OrderState>({
    status: "pending",
    delivery_token: null,
    product_name: null,
  });
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!orderId) return;

    const maxPolls = 30;
    let timeoutId: NodeJS.Timeout;

    async function pollStatus() {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        const data = await res.json();

        setState({
          status: data.status,
          delivery_token: data.delivery_token,
          product_name: data.product_name,
        });

        if (data.status === "paid" || data.status === "failed") return;

        if (pollCount < maxPolls) {
          const delay = Math.min(2000 * Math.pow(1.5, pollCount), 30000);
          timeoutId = setTimeout(
            () => setPollCount((c) => c + 1),
            delay
          );
        }
      } catch {
        if (pollCount < maxPolls) {
          const delay = Math.min(2000 * Math.pow(1.5, pollCount), 30000);
          timeoutId = setTimeout(
            () => setPollCount((c) => c + 1),
            delay
          );
        }
      }
    }

    pollStatus();
    return () => clearTimeout(timeoutId);
  }, [orderId, pollCount]);

  // Invalid
  if (!orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="font-[family-name:var(--font-geist)] text-[24px] font-semibold text-on-surface">
            Invalid request
          </h1>
          <p className="text-secondary">No order ID provided.</p>
          <Link href="/dashboard" className="text-[14px] text-accent-indigo hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Paid — Ready to download
  if (state.status === "paid" && state.delivery_token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[640px] bg-surface-studio border border-outline-variant rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col items-center text-center animate-zoom-in">
          <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-6 border border-accent-indigo/20">
            <span className="material-symbols-outlined text-accent-indigo text-[32px]">
              check_circle
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-geist)] text-[32px] font-bold text-on-surface mb-2">
            Product Published
          </h1>
          <p className="text-[16px] leading-relaxed text-secondary mb-8">
            Your digital product is live and ready to sell.
          </p>

          {state.product_name && (
            <div className="w-full bg-surface-canvas border border-outline-variant rounded-lg p-4 flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container rounded-md flex items-center justify-center border border-outline-variant">
                  <span className="material-symbols-outlined text-secondary text-[24px]">
                    audio_file
                  </span>
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-geist)] text-[18px] font-semibold text-on-surface">
                    {state.product_name}
                  </h2>
                  <span className="text-[14px] text-secondary flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-success-green" />
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          <Link
            href={`/download/${state.delivery_token}`}
            className="w-full bg-accent-indigo text-white px-8 py-3 rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            Download your files
          </Link>

          <p className="text-[12px] text-secondary mt-4">
            Download link expires in 24 hours.
          </p>
        </div>
      </div>
    );
  }

  // Failed
  if (state.status === "failed") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[480px] bg-surface-studio border border-outline-variant rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col items-center text-center">
          <div className="mx-auto bg-error-container w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <span
              className="material-symbols-outlined text-error-red"
              style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}
            >
              error
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-geist)] text-[24px] font-semibold text-on-surface mb-2">
            Payment Failed
          </h1>
          <p className="text-[16px] leading-relaxed text-secondary mb-6">
            Your card was not charged. Please try again or use a different
            payment method.
          </p>
          <Link
            href="/dashboard"
            className="w-full bg-accent-indigo text-white py-3 rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">
              refresh
            </span>
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  // Pending — Processing
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[640px] bg-surface-studio border border-outline-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 md:p-16 overflow-hidden relative">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mb-16">
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
            <span
              className="material-symbols-outlined text-accent-indigo text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-geist)] text-[24px] font-semibold text-on-surface mb-2">
            Confirming your payment
          </h1>
          <p className="text-[16px] leading-relaxed text-secondary max-w-sm">
            Please do not close this page or navigate away while we secure your
            transaction.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-sm mx-auto mb-16">
          <div className="flex flex-col gap-8 relative">
            <div className="absolute left-[11px] top-[14px] bottom-[14px] w-[2px] bg-outline-variant z-0" />
            <div className="absolute left-[11px] top-[14px] h-1/2 w-[2px] bg-accent-indigo z-0 transition-all duration-1000" />

            {/* Step 1 */}
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-success-green flex items-center justify-center shrink-0 border-2 border-surface-studio">
                <span
                  className="material-symbols-outlined text-on-primary text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check
                </span>
              </div>
              <div>
                <span className="text-[14px] font-medium text-on-surface">
                  Payment submitted
                </span>
                <span className="text-[12px] text-secondary block mt-1">
                  Details securely encrypted
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-surface-studio border-2 border-accent-indigo flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-accent-indigo animate-pulse" />
              </div>
              <div>
                <span className="text-[14px] font-medium text-on-surface">
                  Verifying payment
                </span>
                <span className="text-[12px] text-secondary block mt-1">
                  Communicating with your bank...
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 relative z-10 opacity-50">
              <div className="w-6 h-6 rounded-full bg-surface-studio border-2 border-outline-variant flex items-center justify-center shrink-0" />
              <div>
                <span className="text-[14px] font-medium text-on-surface">
                  Preparing files
                </span>
                <span className="text-[12px] text-secondary block mt-1">
                  Generating download links
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-surface-canvas rounded-lg p-4 border border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center text-accent-indigo">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-on-surface">
                Dropcue Digital Assets
              </p>
              <p className="text-[12px] text-secondary mt-0.5">
                Order #{orderId?.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-semibold text-on-surface">Processing</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-secondary">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span className="text-[12px]">Secured by 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
}
