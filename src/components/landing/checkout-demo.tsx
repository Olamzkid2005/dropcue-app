"use client";

import { useState } from "react";

export function CheckoutDemo() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 3000);
  }

  return (
    <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-8 space-y-6">
      {/* Product Summary */}
      <div className="flex items-center gap-4 pb-4 border-b border-hairline">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-ink to-gray-800 flex items-center justify-center shrink-0">
          <i className="fa-solid fa-music text-white opacity-60" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink truncate">
            Midnight Drive Type Beat
          </h3>
          <p className="text-sm text-muted">Premium Beat • WAV + MP3</p>
        </div>
        <span className="text-xl font-semibold text-ink shrink-0">$29</span>
      </div>

      {submitted ? (
        <div className="text-center py-8 space-y-3 animate-fade-in">
          <div className="w-14 h-14 mx-auto bg-green-50 rounded-full flex items-center justify-center border border-green-200">
            <i className="fa-solid fa-check-circle text-green-500 text-2xl" />
          </div>
          <p className="font-semibold text-ink">Payment confirmed!</p>
          <p className="text-sm text-muted">
            Check your email for the download link.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink block">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 px-4 rounded-lg border border-hairline bg-surface text-ink text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
            />
            <p className="text-xs text-muted">
              Your download link will be sent here.
            </p>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-[#2d25a3] transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
          >
            <i className="fa-solid fa-cart-shopping text-sm" />
            Buy $29
          </button>

          <div className="flex items-center justify-center gap-4 pt-2">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <i className="fa-solid fa-lock text-accent" /> Secure checkout
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <i className="fa-solid fa-lock text-accent" /> Secure delivery
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
