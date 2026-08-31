"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const navItems = [
  {
    icon: "fa-solid fa-grid-2",
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: "fa-solid fa-box-open",
    label: "Products",
    href: "/dashboard/products",
  },
  {
    icon: "fa-solid fa-receipt",
    label: "Orders",
    href: "/dashboard/orders",
  },
  {
    icon: "fa-solid fa-gear",
    label: "Settings",
    href: "/dashboard/settings",
  },
];

export function CreatorSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    getUser();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-[260px] bg-paper border-r border-hairline z-40">
      {/* Brand */}
      <div className="flex items-center px-6 h-16 border-b border-hairline">
        <Link href="/" aria-label="Dropcue home" className="block h-10 w-[132px] overflow-hidden rounded-md">
          <img
            src="/logo.png"
            alt="Dropcue"
            className="h-full w-full object-cover object-center scale-[1.7]"
          />
        </Link>
      </div>

      {/* New Product CTA */}
      <div className="px-4 pt-6 pb-2">
        <Link
          href="/dashboard/products/new"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink/90 transition-all duration-200 active:scale-[0.98]"
        >
          <i className="fa-solid fa-plus text-xs" />
          New Product
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink hover:bg-hairline/50"
              }`}
            >
              <i className={`${item.icon} w-5 text-center`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex flex-col gap-1 border-t border-hairline pt-4">
        <a
          href="https://dropcue.co/help"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted hover:text-ink hover:bg-hairline/50 rounded-xl transition-all duration-200"
        >
          <i className="fa-solid fa-circle-question w-5 text-center" />
          Help & Support
        </a>
        {user && (
          <>
            <div className="px-3 py-2 flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.email ?? "")}&backgroundColor=3a30c7&textColor=ffffff&radius=50&fontSize=20&fontWeight=600`}
                alt=""
                className="w-8 h-8 rounded-full border border-hairline shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">
                  {user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted hover:text-ink hover:bg-hairline/50 rounded-xl transition-all duration-200"
            >
              <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center" />
              Sign Out
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

/* Mobile bottom nav bar */
export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { icon: "fa-solid fa-grid-2", label: "Home", href: "/dashboard" },
    { icon: "fa-solid fa-box-open", label: "Products", href: "/dashboard/products" },
    { icon: "fa-solid fa-plus", label: "New", href: "/dashboard/products/new" },
    { icon: "fa-solid fa-receipt", label: "Orders", href: "/dashboard/orders" },
    { icon: "fa-solid fa-gear", label: "Settings", href: "/dashboard/settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav aria-label="Dashboard navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper/90 backdrop-blur-xl border-t border-hairline safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = isActive(item.href);
          const isNew = item.label === "New";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isNew
                  ? "bg-ink text-white px-4 py-2 -mt-4 rounded-full shadow-lg"
                  : active
                    ? "text-ink"
                    : "text-muted"
              }`}
            >
              <i className={`${item.icon} text-lg`} />
              {!isNew && (
                <span className="text-[10px] font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
