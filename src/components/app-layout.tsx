"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <nav className="bg-surface-studio/80 backdrop-blur-xl border-b border-outline-variant/60 fixed top-0 left-0 w-full z-50">
        <div className="flex justify-between items-center h-16 px-6 max-w-[1120px] mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="Dropcue"
                className="h-12 w-auto"
              />
            </Link>
            {user && (
              <div className="hidden md:flex gap-1 items-center">
                <Link
                  href="/dashboard"
                  className="text-accent-indigo font-semibold border-b-2 border-accent-indigo pb-0.5 pt-1 px-1 text-[14px] rounded-sm"
                >
                  Dashboard
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/products/new"
                  className="hidden md:flex bg-accent-indigo text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-accent-indigo/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97] items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    add
                  </span>
                  Create Product
                </Link>
                <button className="text-secondary hover:text-on-surface hover:bg-surface-container-low p-2 rounded-lg transition-all duration-200">
                  <span className="material-symbols-outlined text-[22px]">
                    notifications
                  </span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-8 h-8 rounded-full bg-accent-indigo/10 border border-accent-indigo/20 cursor-pointer hover:bg-accent-indigo/20 transition-colors"
                >
                  <div className="w-full h-full flex items-center justify-center text-accent-indigo text-sm font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="bg-accent-indigo text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-accent-indigo/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="pt-16">{children}</main>
    </>
  );
}
