"use client";

import { useState, useCallback } from "react";
import { submitFeedback } from "@/modules/feedback/server/actions";
import { FEEDBACK_CATEGORIES } from "@/modules/feedback/types";

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
          setTimeout(() => {
            setIsOpen(false);
            setSubmitted(false);
            setCategory("");
            setMessage("");
            setEmail("");
          }, 2000);
        } else {
          setError(result.error || "Failed to submit feedback");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [category, message, email, pageUrl, productId, orderId]
  );

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-surface-studio border border-outline-variant text-on-surface font-label-sm text-label-sm px-4 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] hover:border-accent-indigo transition-all duration-200 active:scale-95 cursor-pointer"
        aria-label="Send feedback"
      >
        <span
          className="material-symbols-outlined text-lg"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          feedback
        </span>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => !submitting && setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-surface-studio border border-outline-variant rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
            {submitted ? (
              /* Success State */
              <div className="flex flex-col items-center justify-center p-section-gap text-center">
                <div className="w-16 h-16 bg-success-green/10 rounded-full flex items-center justify-center mb-stack-md">
                  <span className="material-symbols-outlined text-success-green text-3xl">
                    check_circle
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-sm">
                  Thank you!
                </h3>
                <p className="font-body-md text-body-md text-secondary">
                  Your feedback has been received.
                </p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between p-gutter border-b border-outline-variant">
                  <h3 className="font-section-header text-section-header text-on-surface">
                    Send feedback
                  </h3>
                  <button
                    type="button"
                    onClick={() => !submitting && setIsOpen(false)}
                    className="text-secondary hover:text-on-surface p-1 rounded-md hover:bg-surface-container-low transition-colors cursor-pointer"
                    disabled={submitting}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="p-gutter flex flex-col gap-stack-md">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="font-label-sm text-label-sm text-on-surface">
                      What&apos;s this about?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FEEDBACK_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left font-label-sm text-label-sm transition-all duration-150 cursor-pointer ${
                            category === cat.value
                              ? "border-accent-indigo bg-accent-indigo/5 text-accent-indigo"
                              : "border-outline-variant bg-surface-studio text-on-surface hover:border-secondary hover:bg-surface-container-low"
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-lg"
                            style={{ fontVariationSettings: "'FILL' 0" }}
                          >
                            {cat.icon}
                          </span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label
                      htmlFor="feedback-message"
                      className="font-label-sm text-label-sm text-on-surface flex items-center gap-1"
                    >
                      Tell us more{" "}
                      <span className="text-error-red">*</span>
                    </label>
                    <textarea
                      id="feedback-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the issue or share your suggestion..."
                      rows={4}
                      required
                      className="input-base font-body-md text-body-md resize-y min-h-[80px]"
                    />
                  </div>

                  {/* Email (optional) */}
                  <div className="space-y-2">
                    <label
                      htmlFor="feedback-email"
                      className="font-label-sm text-label-sm text-on-surface"
                    >
                      Email{" "}
                      <span className="text-secondary font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="feedback-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="For follow-up only"
                      className="input-base font-body-md text-body-md"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="font-metadata text-metadata text-error-red">
                      {error}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="p-gutter border-t border-outline-variant flex justify-end gap-stack-sm">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary font-label-sm text-label-sm"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary font-label-sm text-label-sm flex items-center gap-2"
                    disabled={!category || !message.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border w-4 h-4" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          send
                        </span>
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
