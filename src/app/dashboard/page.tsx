"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getPayoutSetupStatus,
  startPayoutSetup,
} from "@/modules/payments/server/connect-actions";
import type { PayoutSetupStatus } from "@/modules/payments/server/connect";

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

/* Shape returned by the get_creator_stats() RPC — one round-trip for
   all dashboard stats (see supabase/migrations/002_dashboard_stats_rpc.sql) */
interface CreatorStatsRpc {
  total_revenue: number | string | null;
  total_orders: number | string | null;
  total_products: number | string | null;
  active_products: number | string | null;
  recent_orders:
    | Array<{
        id: string;
        buyer_email: string;
        amount: number;
        status: string;
        created_at: string;
        product_name: string;
      }>
    | null;
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
        Upload, price, and share your digital products. Track secure delivery in one place.
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
          Track completed sales
        </span>
        <span className="flex items-center gap-1.5">
          <i className="fa-solid fa-naira-sign text-ink" />
          Start with no monthly fee
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Payout setup — Bachs Connect one-time onboarding
   ────────────────────────────────────────────── */
function PayoutSetupBanner({ status }: { status: PayoutSetupStatus }) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (status === "active") return null;

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const result = await startPayoutSetup();
      if (result.success && result.onboarding_url) {
        window.location.href = result.onboarding_url;
        return;
      }
      setError(result.error ?? "Payout setup could not be started.");
    } catch {
      setError("Payout setup could not be started. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  const pending = status === "pending";
  return (
    <div
      className={`p-6 rounded-[var(--radius-jumbo)] shadow-soft border flex flex-col sm:flex-row sm:items-center gap-4 ${
        pending
          ? "bg-blue-50/60 border-blue-200/60"
          : "bg-amber-50/60 border-amber-200/60"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          pending ? "bg-blue-100" : "bg-amber-100"
        }`}
      >
        <i
          className={`fa-solid ${pending ? "fa-hourglass-half text-blue-500" : "fa-wallet text-amber-600"}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold">
          {pending ? "Payout setup in progress" : "One last step: set up payouts"}
        </h3>
        <p className="text-xs text-muted mt-0.5 leading-relaxed">
          {pending
            ? "Your Bachs account is created. Finish the hosted form to activate payments."
            : "Buyers can't pay you until this is done. You'll be sent to a secure Bachs page to add your bank account — Dropcue never sees your bank details. You keep 95% — Dropcue fee is 5% per sale."}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-700 sm:max-w-[220px]">
          {error}
        </p>
      )}
      <button
        onClick={handleStart}
        disabled={starting}
        className="shrink-0 flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-ink/90 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {starting ? (
          <i className="fa-solid fa-spinner fa-spin text-xs" />
        ) : pending ? (
          <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
        ) : (
          <i className="fa-solid fa-arrow-right text-xs" />
        )}
        {pending ? "Resume setup" : "Set up payouts"}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Dashboard — Stats, Actions, Orders
   ────────────────────────────────────────────── */
function DashboardView({
  stats,
  loading,
  payoutStatus,
}: {
  stats: DashboardStats;
  loading: boolean;
  payoutStatus: PayoutSetupStatus;
}) {
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
          <p className="text-xs text-muted mt-2 flex items-center gap-1.5">              From completed sales
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

      {/* Payout setup (hidden once active) */}
      <PayoutSetupBanner status={payoutStatus} />

      {/* Quick Actions */}
      <div
        className={`grid grid-cols-1 gap-4 ${
          payoutStatus === "active" ? "sm:grid-cols-4" : "sm:grid-cols-3"
        }`}
      >
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
            <p className="text-xs text-muted mt-0.5">Track completed sales</p>
          </div>
        </Link>
        {payoutStatus === "active" && (
          <div className="flex items-center gap-4 p-5 bg-green-50/70 rounded-[var(--radius-jumbo)] shadow-soft border border-green-200/60">
            <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-circle-check" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Payouts active</h3>
              <p className="text-xs text-muted mt-0.5">
                Paid straight to your bank · 5% fee
              </p>
            </div>
          </div>
        )}
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
  const [payoutStatus, setPayoutStatus] = useState<PayoutSetupStatus>("unavailable");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserName(user.email ?? "");

        /* Payout setup status (Bachs Connect) — failure is non-fatal. */
        getPayoutSetupStatus()
          .then((state) => setPayoutStatus(state.status))
          .catch(() => setPayoutStatus("unavailable"));

        /* ── Preferred path: ONE round-trip via RPC ──────────────────
           Correct revenue (ALL paid orders) + exact order count. */
        const { data: rpcData, error: rpcError } = await supabase
          .rpc("get_creator_stats")
          .single();

        if (!rpcError && rpcData) {
          const row = rpcData as CreatorStatsRpc;
          setStats({
            totalRevenue: Number(row.total_revenue ?? 0),
            activeProducts: Number(row.active_products ?? 0),
            totalOrders: Number(row.total_orders ?? 0),
            totalProducts: Number(row.total_products ?? 0),
            recentOrders: (row.recent_orders ?? []).map(
              (r): Order => ({
                id: r.id,
                product_id: "",
                buyer_email: r.buyer_email,
                amount: Number(r.amount),
                currency: "NGN",
                status: r.status,
                created_at: r.created_at,
                products: { name: r.product_name },
              })
            ),
          });
          return;
        }

        /* ── Fallback: 2 consolidated queries (RPC not installed yet) ──
           Single join query for ALL orders (correct revenue/count),
           one slim query for product statuses. */
        const [{ data: orders }, { data: products }] = await Promise.all([
          supabase
            .from("orders")
            .select(
              "id, product_id, buyer_email, amount, currency, status, created_at, products!inner(name)"
            )
            .eq("products.creator_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("products")
            .select("id, status")
            .eq("creator_id", user.id),
        ]);

        const allOrders = (orders ?? []) as unknown as Order[];
        const allProducts = (products ?? []) as Product[];

        setStats({
          totalRevenue: allOrders
            .filter((o) => o.status === "paid")
            .reduce((sum, o) => sum + o.amount, 0),
          activeProducts: allProducts.filter((p) => p.status === "published").length,
          totalOrders: allOrders.length,
          recentOrders: allOrders.slice(0, 10),
          totalProducts: allProducts.length,
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
            <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">
              {loading ? "Dropcue" : hasProducts ? "Dashboard" : "Dropcue"}
            </h1>
          </div>

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
        <DashboardView
          stats={stats}
          loading={loading}
          payoutStatus={payoutStatus}
        />
      )}
    </div>
  );
}
