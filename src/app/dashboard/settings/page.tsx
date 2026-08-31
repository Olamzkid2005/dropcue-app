"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user))
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
        <div className="flex items-center h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
          <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">
            Settings
          </h1>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-10 max-w-[640px] mx-auto w-full">
        <section className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-8">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-geist)] mb-6">
            Account
          </h2>

          {loading ? (
            <div className="h-11 bg-hairline rounded-lg animate-pulse" />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xl font-semibold">
                  {user?.email?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user?.email ?? "—"}</p>
                  <p className="text-xs text-muted">Creator account</p>
                </div>
              </div>

              <div className="pt-4 border-t border-hairline space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Account created</span>
                  <span>
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-NG")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Last sign in</span>
                  <span>
                    {user?.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString("en-NG")
                      : "—"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2.5 border border-hairline rounded-lg text-sm font-medium hover:bg-hairline/50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
