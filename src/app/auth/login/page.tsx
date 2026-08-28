"use client";

import { useState } from "react";
import {
  sendMagicLink,
  getGoogleSignInUrl,
  getAppleSignInUrl,
} from "@/modules/auth/server/actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [oauthLoading, setOauthLoading] = useState<
    "google" | "apple" | null
  >(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const result = await sendMagicLink(email);

    if (result.success) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(result.error ?? "Something went wrong");
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setOauthLoading(provider);
    setError("");

    const fn = provider === "google" ? getGoogleSignInUrl : getAppleSignInUrl;
    const result = await fn();

    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setError(result.error ?? `Could not start ${provider} sign-in`);
      setOauthLoading(null);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-[480px] space-y-8">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-geist)] text-[32px] font-bold text-on-surface mb-2">
            Sign in to Dropcue
          </h1>
          <p className="text-[16px] leading-relaxed text-secondary">
            Choose how you&apos;d like to sign in
          </p>
        </div>

        {status === "sent" ? (
          <div className="bg-surface-studio border border-outline-variant rounded-xl p-8 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-green/10 border border-success-green/20">
              <span className="material-symbols-outlined text-success-green text-[32px]">
                mark_email_read
              </span>
            </div>
            <h2 className="font-[family-name:var(--font-geist)] text-[18px] font-semibold text-on-surface mb-2">
              Check your email
            </h2>
            <p className="text-[14px] text-secondary mb-1">
              We sent a magic link to{" "}
              <strong className="text-on-surface">{email}</strong>
            </p>
            <p className="text-[12px] text-secondary">
              The link expires in 15 minutes
            </p>
          </div>
        ) : (
          <div className="bg-surface-studio border border-outline-variant rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-6">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              {/* Google */}
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthLoading !== null}
                className="btn-secondary w-full h-11 text-[14px] font-medium flex items-center justify-center gap-3"
              >
                {oauthLoading === "google" ? (
                  <span className="spinner-border w-4 h-4" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                disabled={oauthLoading !== null}
                className="btn-secondary w-full h-11 text-[14px] font-medium flex items-center justify-center gap-3"
              >
                {oauthLoading === "apple" ? (
                  <span className="spinner-border w-4 h-4" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                )}
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant" />
              </div>
              <div className="relative flex justify-center text-[13px]">
                <span className="bg-surface-studio px-3 text-secondary">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Email Magic Link */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-[14px] font-medium text-on-surface block"
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
                  className="input-base"
                />
              </div>

              {error && (
                <div className="bg-error-container/50 border border-error-red/30 rounded-lg p-3 text-[14px] text-error-red">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading" || oauthLoading !== null}
                className="btn-primary w-full h-11 text-[14px] font-medium"
              >
                {status === "loading" ? "Sending..." : "Send magic link"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
