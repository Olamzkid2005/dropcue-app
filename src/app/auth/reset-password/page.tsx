"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/modules/auth/server/actions";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "success" | "error" | "invalid">("loading");
  const [error, setError] = useState("");

  // Check if user has a valid recovery session from the email link
  useEffect(() => {
    const supabase = createClient();

    // Supabase stores the recovery token in the URL hash
    // After exchange, the user has a temporary session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("ready");
      } else {
        // No valid session — link may be expired or invalid
        setStatus("invalid");
      }
    });
  }, []);

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

  const passwordStrength = getPasswordStrength(newPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setStatus("submitting");

    const result = await resetPassword(newPassword);

    if (result.success) {
      setStatus("success");
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } else {
      setStatus("error");
      setError(result.error ?? "Failed to reset password");
    }
  }

  // Loading state while checking session
  if (status === "loading") {
    return (
      <>
        <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-hairline">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="Dropcue" className="h-12 w-auto" />
            </Link>
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 bg-paper">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[14px] text-muted">Verifying your reset link...</p>
          </div>
        </main>
      </>
    );
  }

  // Invalid/expired link
  if (status === "invalid") {
    return (
      <>
        <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-hairline">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="Dropcue" className="h-12 w-auto" />
            </Link>
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 bg-paper">
          <div className="w-full max-w-[480px] space-y-8">
            <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <i className="fa-solid fa-link-slash text-2xl text-red-500" />
              </div>
              <h1 className="text-[24px] font-semibold text-ink">
                Link expired or invalid
              </h1>
              <p className="text-[14px] text-muted leading-relaxed">
                This password reset link has expired or is invalid.
                Please request a new one.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-accent text-white text-[14px] font-medium px-6 hover:bg-[#2d25a3] transition-colors"
              >
                Request new link
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <>
        <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-hairline">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="Dropcue" className="h-12 w-auto" />
            </Link>
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 bg-paper">
          <div className="w-full max-w-[480px] space-y-8">
            <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <i className="fa-solid fa-check text-2xl text-green-600" />
              </div>
              <h1 className="text-[24px] font-semibold text-ink">
                Password updated!
              </h1>
              <p className="text-[14px] text-muted leading-relaxed">
                Your password has been successfully reset.
                Redirecting you to the dashboard...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Reset form
  return (
    <>
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-hairline">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="Dropcue" className="h-12 w-auto" />
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
              Create new password
            </h1>
            <p className="text-[16px] leading-relaxed text-muted">
              Enter your new password below.
            </p>
          </div>

          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="text-[14px] font-medium text-ink block"
                >
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-11 px-4 rounded-lg border border-hairline bg-surface text-ink text-[14px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
                {newPassword.length > 0 && (
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

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-[14px] font-medium text-ink block"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full h-11 px-4 rounded-lg border border-hairline bg-surface text-ink text-[14px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[12px] text-red-500">
                    Passwords do not match
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[14px] text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting" || newPassword !== confirmPassword}
                className="w-full h-11 bg-accent text-white rounded-lg text-[14px] font-medium hover:bg-[#2d25a3] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "submitting" ? "Updating password..." : "Update password"}
              </button>
            </form>
          </div>

          <p className="text-center text-[14px] text-muted">
            <Link
              href="/auth/login"
              className="text-accent font-medium hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
