"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  email: string;
  created_at: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "danger">("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const tabs = [
    { id: "profile" as const, icon: "fa-solid fa-user", label: "Profile" },
    { id: "notifications" as const, icon: "fa-solid fa-bell", label: "Notifications" },
    { id: "danger" as const, icon: "fa-solid fa-triangle-exclamation", label: "Danger Zone" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
        <div className="flex items-center justify-between h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
          <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          {/* Tabs sidebar */}
          <div className="flex lg:flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left ${
                  activeTab === tab.id
                    ? "bg-ink text-white"
                    : "text-muted hover:text-ink hover:bg-hairline/50"
                }`}
              >
                <i className={`${tab.icon} w-4 text-center`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-[640px]">
            {activeTab === "profile" && (
              <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-8">
                <h2 className="text-xl font-semibold font-[family-name:var(--font-geist)] mb-6">Profile</h2>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-hairline rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      {user?.email ? (
                        <img
                          src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.email)}&backgroundColor=3a30c7&textColor=ffffff&radius=50&fontSize=42&fontWeight=600`}
                          alt="Profile Photo"
                          className="w-16 h-16 rounded-full shadow-soft border border-hairline"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ink to-ink/70 flex items-center justify-center text-white text-2xl font-semibold shadow-soft">
                          ?
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">Profile Photo</p>
                        <p className="text-xs text-muted">Auto-generated from your email</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <input
                        type="email"
                        value={user?.email ?? ""}
                        disabled
                        className="w-full h-11 px-4 rounded-lg border border-hairline bg-paper text-sm text-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted">
                        Email is managed through your authentication provider.
                      </p>
                    </div>

                    {/* Account Info */}
                    <div className="pt-4 border-t border-hairline space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">User ID</span>
                        <span className="font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Account Created</span>
                        <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString("en-NG") : "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Last Sign In</span>
                        <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("en-NG") : "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-8">
                <h2 className="text-xl font-semibold font-[family-name:var(--font-geist)] mb-6">Notifications</h2>

                <div className="space-y-6">
                  {[
                    { label: "New Order", desc: "Get notified when someone buys your product", defaultOn: true },
                    { label: "Payment Received", desc: "Alert when a payment is confirmed", defaultOn: true },
                    { label: "Product Downloaded", desc: "Know when a buyer downloads your files", defaultOn: false },
                    { label: "Weekly Summary", desc: "Receive a weekly report of your sales", defaultOn: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-hairline last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" />
                        <div className="w-11 h-6 bg-hairline peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ink" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "danger" && (
              <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-red-200 p-8">
                <h2 className="text-xl font-semibold font-[family-name:var(--font-geist)] mb-2 text-red-600">Danger Zone</h2>
                <p className="text-sm text-muted mb-8">Irreversible actions that affect your account.</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-hairline">
                    <div>
                      <p className="text-sm font-medium">Sign Out</p>
                      <p className="text-xs text-muted mt-0.5">Sign out of your account on this device.</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 border border-hairline rounded-lg text-sm font-medium hover:bg-hairline/50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-red-600">Delete Account</p>
                      <p className="text-xs text-muted mt-0.5">
                        Permanently delete your account and all associated data. This cannot be undone.
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
