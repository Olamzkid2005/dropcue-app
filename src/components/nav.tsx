"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Nav() {
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
    <nav className="bg-surface-studio border-b border-outline-variant fixed top-0 left-0 w-full z-50 flex justify-between items-center h-16 px-6 max-w-[1120px] mx-auto">
      {/* Left: Brand */}
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-geist)] text-[24px] font-bold text-on-surface tracking-tight"
        >
          Dropcue
        </Link>
        {user && (
          <div className="hidden md:flex gap-4 items-center">
            <Link
              href="/"
              className="text-accent-indigo font-bold border-b-2 border-accent-indigo pb-1 pt-1 text-[14px] font-medium"
            >
              Products
            </Link>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link
              href="/products/new"
              className="hidden md:flex bg-accent-indigo text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Create Product
            </Link>
            <button className="text-secondary hover:bg-surface-container-low p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-8 h-8 rounded-full bg-surface-dim overflow-hidden border border-outline-variant cursor-pointer"
            >
              <div className="w-full h-full flex items-center justify-center text-secondary text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </button>
          </>
        ) : (
          <Link
            href="/auth/login"
            className="bg-accent-indigo text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
