"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { forgotPassword } from "@/modules/auth/server/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const result = await forgotPassword(email);

    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setError(result.error ?? "Something went wrong");
    }
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-hairline">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo className="h-12 w-auto" />
          </Link>
          <Link
            href="/auth/login"
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 bg-paper">
        <div className="w-full max-w-[480px] space-y-8">
          <div className="text-center">
            <h1 className="text-[32px] font-semibold tracking-tight text-ink mb-2">
              Reset your password
            </h1>
            <p className="text-[16px] leading-relaxed text-muted">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-8 space-y-6">
            {status === "success" ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <i className="fa-solid fa-check text-2xl text-green-600" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-ink mb-2">
                    Check your email
                  </h2>
                  <p className="text-[14px] text-muted leading-relaxed">
                    We sent a password reset link to{" "}
                    <span className="font-medium text-ink">{email}</span>.
                    Check your inbox and click the link to reset your password.
                  </p>
                </div>
                <p className="text-[13px] text-muted">
                  Didn&apos;t receive the email?{" "}
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setEmail("");
                    }}
                    className="text-accent font-medium hover:underline"
                  >
                    Try again
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-[14px] font-medium text-ink block"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-4 rounded-lg border border-hairline bg-surface text-ink text-[14px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[14px] text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full h-11 bg-accent text-white rounded-lg text-[14px] font-medium hover:bg-[#2d25a3] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Sending reset link..." : "Send reset link"}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-[14px] text-muted">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="text-accent font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
