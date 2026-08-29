"use client";

import { useState } from "react";
import Link from "next/link";
import {
  signIn,
  signUp,
  getGoogleSignInUrl,
  getAppleSignInUrl,
} from "@/modules/auth/server/actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null
  );
  const [rememberMe, setRememberMe] = useState(true);

  function getPasswordStrength(pw: string): {
    score: number;
    label: string;
    color: string;
  } {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
    if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
    if (score <= 4) return { score, label: "Strong", color: "bg-lime-500" };
    return { score, label: "Very strong", color: "bg-green-500" };
  }

  const passwordStrength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setSuccess("");

    const fn = mode === "login" ? signIn : signUp;
    const result = await fn(email, password, rememberMe);

    if (result.success) {
      if (mode === "signup") {
        setSuccess("Check your email to confirm your account.");
        setStatus("idle");
      } else {
        window.location.href = "/dashboard";
      }
    } else {
      setStatus("error");
      setError(result.error ?? "Something went wrong");
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setOauthLoading(provider);
    setError("");
    setSuccess("");

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
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-hairline">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center"
          >
            <img
              src="/logo.png"
              alt="Dropcue"
              className="h-12 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 bg-paper">
        <div className="w-full max-w-[480px] space-y-8">
          <div className="text-center">
            <h1 className="text-[32px] font-semibold tracking-tight text-ink mb-2">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-[16px] leading-relaxed text-muted">
              {mode === "login"
                ? "Sign in to your Dropcue account"
                : "Start selling digital products in minutes"}
            </p>
          </div>

          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-8 space-y-6">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthLoading !== null}
                className="w-full h-11 text-[14px] font-medium flex items-center justify-center gap-3 border border-hairline rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {oauthLoading === "google" ? (
                  <span className="spinner-border w-4 h-4" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
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

              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                disabled={oauthLoading !== null}
                className="w-full h-11 text-[14px] font-medium flex items-center justify-center gap-3 border border-hairline rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                <div className="w-full border-t border-hairline" />
              </div>
              <div className="relative flex justify-center text-[13px]">
                <span className="bg-surface px-3 text-muted">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Email / Password Form */}
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

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-[14px] font-medium text-ink block"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "signup" ? "At least 6 characters" : "Your password"
                  }
                  className="w-full h-11 px-4 rounded-lg border border-hairline bg-surface text-ink text-[14px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
                {mode === "signup" && password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                            i <= passwordStrength.score
                              ? passwordStrength.color
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[12px] text-muted">
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Remember me checkbox */}
              {mode === "login" && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-hairline text-accent focus:ring-accent"
                    />
                    <span className="text-[14px] text-muted">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-[14px] text-accent hover:underline"
                    onClick={() => {
                      // TODO: Add forgot password flow
                      setError("Password reset coming soon");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[14px] text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-[14px] text-green-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading" || oauthLoading !== null}
                className="w-full h-11 bg-accent text-white rounded-lg text-[14px] font-medium hover:bg-[#2d25a3] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading"
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
          </div>

          {/* Toggle login/signup */}
          <p className="text-center text-[14px] text-muted">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-accent font-medium hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-accent font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </>
  );
}
