"use client";

import { useState, useCallback } from "react";
import { submitFeedback } from "@/modules/feedback/server/actions";
import { FEEDBACK_CATEGORIES } from "@/modules/feedback/types";

const CATEGORY_ICONS: Record<string, string> = {
  broken: "fa-solid fa-bug",
  confusing: "fa-solid fa-circle-question",
  feature_request: "fa-solid fa-lightbulb",
  general: "fa-solid fa-comment",
};

interface FeedbackButtonProps {
  pageUrl: string;
  productId?: string;
  orderId?: string;
}

export function FeedbackButton({
  pageUrl,
  productId,
  orderId,
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleClose = useCallback(() => {
    if (submitting) return;
    setIsOpen(false);
    // Reset after animation
    setTimeout(() => {
      setSubmitted(false);
      setCategory("");
      setMessage("");
      setEmail("");
      setError("");
    }, 200);
  }, [submitting]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!category || !message.trim()) return;

      setSubmitting(true);
      setError("");

      try {
        const result = await submitFeedback({
          category: category as
            | "broken"
            | "confusing"
            | "feature_request"
            | "general",
          message: message.trim(),
          email: email.trim() || undefined,
          page_url: pageUrl,
          product_id: productId,
          order_id: orderId,
        });

        if (result.success) {
          setSubmitted(true);
          setTimeout(handleClose, 2200);
        } else {
          setError(result.error || "Failed to submit feedback");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [category, message, email, pageUrl, productId, orderId, handleClose]
  );

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-surface border border-hairline text-ink text-[13px] font-medium px-4 py-2.5 rounded-full shadow-soft hover:shadow-jumbo hover:border-accent/30 transition-all duration-200 active:scale-95 cursor-pointer"
        aria-label="Send feedback"
      >
        <i className="fa-solid fa-comment-dots text-accent text-[14px]" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleClose}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-[440px] bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {submitted ? (
              /* Success State */
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-5">
                  <i className="fa-solid fa-check text-2xl text-[#10B981]" />
                </div>
                <h3 className="text-[20px] font-semibold text-ink mb-2">
                  Thank you!
                </h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Your feedback has been received. We appreciate you helping us
                  improve Dropcue.
                </p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
                  <h3 className="text-[16px] font-semibold text-ink">
                    Send feedback
                  </h3>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-gray-100 transition-colors cursor-pointer"
                    disabled={submitting}
                  >
                    <i className="fa-solid fa-xmark text-[16px]" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Category Selection */}
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-medium text-ink block">
                      What&apos;s this about?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FEEDBACK_CATEGORIES.map((cat) => {
                        const isSelected = category === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setCategory(cat.value)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? "border-accent bg-accent/5 text-accent ring-1 ring-accent/20"
                                : "border-hairline bg-surface text-ink hover:border-muted hover:bg-gray-50/50"
                            }`}
                          >
                            <i
                              className={`${CATEGORY_ICONS[cat.value] ?? "fa-solid fa-circle"} text-[14px] ${
                                isSelected ? "text-accent" : "text-muted"
                              }`}
                            />
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label
                      htmlFor="feedback-message"
                      className="text-[13px] font-medium text-ink block"
                    >
                      Tell us more{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="feedback-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the issue or share your suggestion..."
                      rows={4}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-hairline bg-surface text-ink text-[14px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y min-h-[100px] transition-colors"
                    />
                  </div>

                  {/* Email (optional) */}
                  <div className="space-y-2">
                    <label
                      htmlFor="feedback-email"
                      className="text-[13px] font-medium text-ink block"
                    >
                      Email{" "}
                      <span className="text-muted font-normal">(optional)</span>
                    </label>
                    <input
                      id="feedback-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="For follow-up only"
                      className="w-full h-11 px-4 rounded-xl border border-hairline bg-surface text-ink text-[14px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600">
                      <i className="fa-solid fa-circle-exclamation text-[14px] shrink-0" />
                      {error}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-hairline flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-10 px-5 rounded-xl border border-hairline bg-surface text-ink text-[13px] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-accent text-white text-[13px] font-medium hover:bg-[#3730a3] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    disabled={!category || !message.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane text-[12px]" />
                        Send feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
