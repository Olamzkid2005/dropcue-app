"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  status: string;
  public_id: string;
  created_at: string;
}

interface Order {
  id: string;
  product_id: string;
  buyer_email: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  products?: { name: string } | null;
}

interface DashboardStats {
  totalRevenue: number;
  activeProducts: number;
  totalOrders: number;
  recentOrders: Order[];
  totalProducts: number;
}

function formatNaira(amountInKobo: number): string {
  const naira = amountInKobo / 100;
  return `\u20A6${naira.toLocaleString("en-NG")}`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/* ──────────────────────────────────────────────
   Empty State — Welcome / Onboarding
   ────────────────────────────────────────────── */
function WelcomeState({ userName }: { userName: string }) {
  const steps = [
    {
      icon: "fa-solid fa-cloud-arrow-up",
      title: "Upload your file",
      desc: "Drag and drop audio, video, PDFs — we handle hosting and delivery.",
    },
    {
      icon: "fa-solid fa-tag",
      title: "Set your price",
      desc: "Choose a fixed price in Naira. You control everything.",
    },
    {
      icon: "fa-solid fa-share-nodes",
      title: "Share one link",
      desc: "Paste your link anywhere — socials, emails, or your bio.",
    },
    {
      icon: "fa-solid fa-money-bill-wave",
      title: "Get paid",
      desc: "Buyers pay, you get notified, and the file ships automatically.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-24 max-w-[720px] mx-auto w-full">
      {/* Hero icon */}
      <div className="mb-8">
        <img
          src="/logo.png"
          alt="Dropcue"
          className="w-24 h-24 object-contain drop-shadow-lg"
        />
      </div>

      {/* Heading */}
      <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight font-[family-name:var(--font-geist)] text-center mb-4">
        Welcome to Dropcue{userName ? `, ${userName.split("@")[0]}` : ""}
      </h1>
      <p className="text-muted text-lg text-center max-w-md mb-10 leading-relaxed">
        Upload, price, and share your digital products. Get paid instantly. It takes less than five minutes.
      </p>

      {/* Big CTA */}
      <Link
        href="/dashboard/products/new"
        className="group flex items-center gap-3 bg-ink text-white px-8 py-4 rounded-2xl text-base font-medium hover:bg-ink/90 transition-all duration-300 shadow-jumbo hover:shadow-[0_20px_60px_rgba(20,20,22,0.25)] active:scale-[0.97] mb-12"
      >
        <i className="fa-solid fa-plus text-sm" />
        Create Your First Product
        <i className="fa-solid fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* How it works */}
      <div className="w-full">
        <p className="text-xs uppercase tracking-widest text-muted font-semibold text-center mb-8">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 bg-surface rounded-2xl border border-hairline shadow-soft"
            >
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                <i className={`${step.icon} text-accent text-sm`} />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-0.5">{step.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust signals */}
      <div className="flex items-center gap-6 mt-10 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <i className="fa-solid fa-shield-halved text-ink" />
          Secure delivery
        </span>
        <span className="flex items-center gap-1.5">
          <i className="fa-solid fa-bolt text-ink" />
          Instant payouts
        </span>
        <span className="flex items-center gap-1.5">
          <i className="fa-solid fa-naira-sign text-ink" />
          Zero fees to start
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Dashboard — Stats, Actions, Orders
   ────────────────────────────────────────────── */
function DashboardView({ stats, loading }: { stats: DashboardStats; loading: boolean }) {
  return (
    <div className="flex-1 p-6 lg:p-10 max-w-[1200px] mx-auto w-full flex flex-col gap-10">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight font-[family-name:var(--font-geist)]">
            Overview
          </h2>
          <p className="text-muted mt-2">
            Here&apos;s what&apos;s happening with your products today.
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-ink/90 transition-all duration-200 active:scale-[0.98] w-fit"
        >
          <i className="fa-solid fa-plus text-xs" />
          New Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-6 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline group hover:shadow-jumbo transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted">Total Revenue</span>
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-naira-sign text-accent" />
            </div>
          </div>
          <div className="text-3xl font-semibold tracking-tight font-[family-name:var(--font-geist)]">
            {loading ? <div className="h-8 w-24 bg-hairline rounded-lg animate-pulse" /> : formatNaira(stats.totalRevenue)}
          </div>
          <p className="text-xs text-muted mt-2 flex items-center gap-1.5">
            <i className="fa-solid fa-arrow-trend-up text-[10px]" />
            From completed sales
          </p>
        </div>

        <div className="bg-surface p-6 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline group hover:shadow-jumbo transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted">Active Products</span>
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-box-open text-accent" />
            </div>
          </div>
          <div className="text-3xl font-semibold tracking-tight font-[family-name:var(--font-geist)]">
            {loading ? <div className="h-8 w-16 bg-hairline rounded-lg animate-pulse" /> : stats.activeProducts}
          </div>
          <p className="text-xs text-muted mt-2">Published and live</p>
        </div>

        <div className="bg-surface p-6 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline group hover:shadow-jumbo transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted">Total Orders</span>
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-receipt text-accent" />
            </div>
          </div>
          <div className="text-3xl font-semibold tracking-tight font-[family-name:var(--font-geist)]">
            {loading ? <div className="h-8 w-16 bg-hairline rounded-lg animate-pulse" /> : stats.totalOrders}
          </div>
          <p className="text-xs text-muted mt-2">Across all products</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-4 p-5 bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline hover:shadow-jumbo hover:border-ink/20 transition-all group"
        >
          <div className="w-12 h-12 bg-ink text-white rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i className="fa-solid fa-cloud-arrow-up" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Upload New Product</h3>
            <p className="text-xs text-muted mt-0.5">Set price and share</p>
          </div>
        </Link>
        <Link
          href="/dashboard/products"
          className="flex items-center gap-4 p-5 bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline hover:shadow-jumbo hover:border-ink/20 transition-all group"
        >
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i className="fa-solid fa-box-open" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Manage Products</h3>
            <p className="text-xs text-muted mt-0.5">Edit, view, and organize</p>
          </div>
        </Link>
        <Link
          href="/dashboard/orders"
          className="flex items-center gap-4 p-5 bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline hover:shadow-jumbo hover:border-ink/20 transition-all group"
        >
          <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i className="fa-solid fa-receipt" />
          </div>
          <div>
            <h3 className="text-sm font-medium">View Orders</h3>
            <p className="text-xs text-muted mt-0.5">Track sales and payouts</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
          <h3 className="text-base font-semibold font-[family-name:var(--font-geist)]">Recent Orders</h3>
          <Link href="/dashboard/orders" className="text-sm font-medium text-accent hover:underline">
            View All
          </Link>
        </div>
        <div className="divide-y divide-hairline">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="flex items-center gap-3 text-muted text-sm">
                <i className="fa-solid fa-spinner fa-spin" />
                Loading orders...
              </div>
            </div>
          ) : stats.recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-hairline/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-receipt text-2xl text-muted" />
              </div>
              <h4 className="text-base font-medium mb-1">No orders yet</h4>
              <p className="text-sm text-muted">
                Orders will appear here once buyers purchase your products.
              </p>
            </div>
          ) : (
            stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-paper/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <i
                      className={`fa-solid text-sm ${
                        order.status === "paid"
                          ? "fa-circle-check text-green-500"
                          : "fa-clock text-amber-500"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {order.products?.name ?? "Product"}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {order.buyer_email} · {timeAgo(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-semibold">{formatNaira(order.amount)}</span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      order.status === "paid"
                        ? "bg-green-50 text-green-700"
                        : order.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Dashboard Page
   ────────────────────────────────────────────── */
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeProducts: 0,
    totalOrders: 0,
    recentOrders: [],
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserName(user.email ?? "");

        const { data: products } = await supabase
          .from("products")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false });

        const productIds = (products ?? []).map((p: Product) => p.id);
        let recentOrders: Order[] = [];

        if (productIds.length > 0) {
          const { data: orders } = await supabase
            .from("orders")
            .select("*, products(name)")
            .in("product_id", productIds)
            .order("created_at", { ascending: false })
            .limit(10);
          recentOrders = (orders ?? []) as Order[];
        }

        const activeProducts = (products ?? []).filter(
          (p: Product) => p.status === "published"
        ).length;

        const totalRevenue = recentOrders
          .filter((o: Order) => o.status === "paid")
          .reduce((sum: number, o: Order) => sum + o.amount, 0);

        setStats({
          totalRevenue,
          activeProducts,
          totalOrders: recentOrders.length,
          recentOrders,
          totalProducts: (products ?? []).length,
        });
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const hasProducts = stats.totalProducts > 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
        <div className="flex items-center justify-between h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="lg:hidden flex items-center gap-2">
              <img src="/logo.png" alt="Dropcue" className="h-8 w-auto" />
            </Link>
            <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">
              {loading ? "Dropcue" : hasProducts ? "Dashboard" : "Dropcue"}
            </h1>
          </div>
          {hasProducts && (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/products/new"
                className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink/90 transition-all duration-200 active:scale-[0.98]"
              >
                <i className="fa-solid fa-plus text-xs" />
                <span className="hidden sm:inline">New Product</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Conditional render: empty state or dashboard */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-muted" />
            <p className="text-sm text-muted">Loading your dashboard...</p>
          </div>
        </div>
      ) : !hasProducts ? (
        <WelcomeState userName={userName} />
      ) : (
        <DashboardView stats={stats} loading={loading} />
      )}
    </div>
  );
}
