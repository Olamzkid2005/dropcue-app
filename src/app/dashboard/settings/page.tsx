"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user))
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  const email = user?.email ?? "—";
  const initial = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center px-6 lg:px-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Account</p>
            <h1 className="font-[family-name:var(--font-geist)] text-lg font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-6 p-6 lg:p-10">
        <section className="overflow-hidden rounded-[var(--radius-jumbo)] border border-hairline bg-surface shadow-soft">
          <div className="border-b border-hairline bg-gradient-to-br from-accent/10 via-surface to-surface px-6 py-8 lg:px-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Your Dropcue account</p>
            <h2 className="font-[family-name:var(--font-geist)] text-2xl font-semibold tracking-tight lg:text-3xl">
              Keep your creator profile close at hand.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Your account details are managed securely through Supabase authentication.
            </p>
          </div>

          <div className="p-6 lg:p-8">
            {loading ? (
              <div className="space-y-4" aria-label="Loading account settings">
                <div className="h-16 w-16 animate-pulse rounded-2xl bg-hairline" />
                <div className="h-4 w-56 animate-pulse rounded bg-hairline" />
                <div className="h-4 w-40 animate-pulse rounded bg-hairline" />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ink text-2xl font-semibold text-white shadow-soft">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{email}</p>
                    <p className="mt-1 text-sm text-muted">Creator account · Email verified by Supabase</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-hairline bg-paper p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">Email address</p>
                    <p className="mt-2 truncate text-sm font-medium">{email}</p>
                  </div>
                  <div className="rounded-2xl border border-hairline bg-paper p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">Member since</p>
                    <p className="mt-2 text-sm font-medium">{formatDate(user?.created_at)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Sign out of Dropcue</p>
                    <p className="mt-1 text-sm text-muted">You can sign back in anytime with your email.</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {signingOut && <i className="fa-solid fa-spinner fa-spin text-xs" />}
                    {signingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["fa-solid fa-lock", "Secure by default", "Authentication is handled by Supabase."],
            ["fa-solid fa-bolt", "Fast delivery", "Buyers receive secure download access after payment."],
            ["fa-solid fa-circle-question", "Need help?", "Contact support if you need assistance."],
          ].map(([icon, title, description]) => (
            <div key={title} className="rounded-2xl border border-hairline bg-surface p-5 shadow-soft">
              <i className={`${icon} text-accent`} />
              <h3 className="mt-4 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
