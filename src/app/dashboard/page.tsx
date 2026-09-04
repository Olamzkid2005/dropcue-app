"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  ExternalLink,
  FileUp,
  LayoutDashboard,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
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
function WelcomeState({
  userName,
  payoutStatus,
}: {
  userName: string;
  payoutStatus: PayoutSetupStatus;
}) {
  const [guideOpen, setGuideOpen] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [payoutStarting, setPayoutStarting] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const onboardingStorageKey = `dropcue:onboarding-complete:${userName || "account"}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setGuideOpen(window.localStorage.getItem(onboardingStorageKey) !== "true");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [onboardingStorageKey]);

  function closeGuide() {
    window.localStorage.setItem(onboardingStorageKey, "true");
    setGuideOpen(false);
  }

  function finishGuide() {
    closeGuide();
  }

  async function handlePayoutSetup() {
    setPayoutStarting(true);
    setPayoutError(null);
    try {
      const result = await startPayoutSetup();
      if (result.success && result.onboarding_url) {
        window.location.href = result.onboarding_url;
        return;
      }
      setPayoutError(result.error ?? "Payout setup could not be started.");
    } catch {
      setPayoutError("Payout setup could not be started. Please try again.");
    } finally {
      setPayoutStarting(false);
    }
  }

  const guideSteps = [
    {
      eyebrow: "Start here",
      title: "Turn your work into a simple buying experience.",
      description:
        "Dropcue gives you one place to publish a digital product, collect payment, and deliver the file securely after a purchase.",
      icon: LayoutDashboard,
      accent: "bg-[#eeecff] text-accent",
      details: [
        "Create a product page in a few minutes",
        "Share one public link anywhere",
        "See sales and delivery activity in your dashboard",
      ],
    },
    {
      eyebrow: "Before your first sale",
      title: "Set up where your earnings should go.",
      description:
        "Payout setup is a one-time step. Bachs securely collects your bank details, while Dropcue only receives the payout status needed to let buyers pay you.",
      icon: WalletCards,
      accent: "bg-[#fff5dc] text-[#9a6500]",
      details: [
        "Your bank details stay with Bachs",
        "Buyers cannot pay until payouts are active",
        "Dropcue keeps a 5% platform fee per sale",
      ],
    },
    {
      eyebrow: "Build and share",
      title: "Publish once. Sell from one link.",
      description:
        "Add a name, description, price, and digital file. Dropcue creates the product page and gives you a link ready for your audience.",
      icon: FileUp,
      accent: "bg-[#e8f7f1] text-[#087a55]",
      details: [
        "Upload supported files from the product form",
        "Review the product before publishing",
        "Copy the public link to your bio, email, or socials",
      ],
    },
    {
      eyebrow: "After someone buys",
      title: "Delivery happens automatically.",
      description:
        "A successful payment creates secure, time-limited download access and sends the buyer their delivery email. You stay in control from the dashboard.",
      icon: ShieldCheck,
      accent: "bg-[#e9f1ff] text-[#2563a8]",
      details: [
        "Orders appear in your Orders page",
        "Download access is protected and trackable",
        "Settings, support, and account controls are always available",
      ],
    },
  ];

  if (guideOpen === null) {
    return <div className="flex-1" aria-label="Loading onboarding" />;
  }

  if (!guideOpen) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[680px] bg-surface border border-hairline rounded-[var(--radius-jumbo)] shadow-soft p-8 lg:p-10 text-center animate-fade-in">
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-[#eeecff] text-accent flex items-center justify-center">
            <Check size={25} strokeWidth={2.5} />
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold mb-3">You&apos;re ready</p>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight font-[family-name:var(--font-geist)] mb-3">
            Welcome to Dropcue{userName ? `, ${userName.split("@")[0]}` : ""}.
          </h1>
          <p className="text-muted max-w-md mx-auto leading-relaxed mb-8">
            Your workspace is ready. Create your first product and Dropcue will guide buyers from payment to secure delivery.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center justify-center gap-2 bg-ink text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-ink/90 transition-all active:scale-[0.98]"
            >
              Create your first product
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-muted hover:text-ink hover:bg-hairline/50 transition-colors"
            >
              Open the guide
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = guideSteps[step];
  const Icon = current.icon;
  const isPayoutStep = step === 1;
  const isLastStep = step === guideSteps.length - 1;
  const payoutLabel =
    payoutStatus === "active"
      ? "Active"
      : payoutStatus === "pending"
        ? "Setup in progress"
        : payoutStatus === "unavailable"
          ? "Temporarily unavailable"
          : "Not set up";
  const payoutDescription =
    payoutStatus === "active"
      ? "You can accept payments when your product is published."
      : payoutStatus === "unavailable"
        ? "Payout status could not be checked right now. You can continue the guide and try again from the dashboard."
        : "You can create your product first, then finish payouts before sharing it.";

  return (
    <div className="flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12 animate-fade-in">
      <div className="w-full max-w-[1040px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-auto object-contain" />
            <span className="hidden sm:block h-5 w-px bg-hairline" />
            <span className="hidden sm:block text-sm text-muted">Quick start</span>
          </div>
          <button
            type="button"
            onClick={closeGuide}
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Skip for now
          </button>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-8 lg:gap-14 items-start">
          <aside className="lg:sticky lg:top-28">
            <p className="text-xs uppercase tracking-[0.18em] text-muted font-semibold mb-4">Your first day</p>
            <nav aria-label="Onboarding steps" className="grid grid-cols-4 lg:grid-cols-1 gap-2">
              {guideSteps.map((item, index) => {
                const StepIcon = item.icon;
                const active = index === step;
                const complete = index < step;
                return (
                  <button
                    key={item.eyebrow}
                    type="button"
                    onClick={() => setStep(index)}
                    aria-current={active ? "step" : undefined}
                    className={`group flex items-center gap-3 rounded-xl p-2 lg:p-3 text-left transition-colors ${
                      active ? "bg-surface border border-hairline shadow-soft" : "hover:bg-surface/70"
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? item.accent : "bg-hairline/60 text-muted"}`}>
                      {complete ? <Check size={16} strokeWidth={2.5} /> : <StepIcon size={16} />}
                    </span>
                    <span className="hidden lg:block min-w-0">
                      <span className={`block text-xs font-semibold ${active ? "text-ink" : "text-muted"}`}>{item.eyebrow}</span>
                      <span className="block text-[11px] text-muted mt-0.5">Step {index + 1} of {guideSteps.length}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="hidden lg:flex items-start gap-2 mt-8 text-xs text-muted leading-5">
              <CircleHelp size={15} className="shrink-0 mt-0.5" />
              <p>You can reopen this guide from this page if you skip it.</p>
            </div>
          </aside>

          <section className="bg-surface border border-hairline rounded-[var(--radius-jumbo)] shadow-soft overflow-hidden">
            <div className="h-1 bg-hairline">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${((step + 1) / guideSteps.length) * 100}%` }} />
            </div>
            <div className="p-7 sm:p-10 lg:p-14">
              <div className="flex items-center justify-between gap-4 mb-12">
                <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${current.accent}`}>
                  <Icon size={27} strokeWidth={1.8} />
                </span>
                <span className="text-xs font-semibold text-muted">0{step + 1} / 0{guideSteps.length}</span>
              </div>

              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-accent mb-4">{current.eyebrow}</p>
              <h1 className="max-w-[620px] text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.12] font-[family-name:var(--font-geist)]">
                {current.title}
              </h1>
              <p className="max-w-[620px] text-base leading-7 text-muted mt-5">
                {current.description}
              </p>

              <ul className="grid sm:grid-cols-3 gap-3 mt-9">
                {current.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2 rounded-xl bg-paper border border-hairline p-3 text-xs leading-5 text-ink/80">
                    <Check size={15} className="text-accent shrink-0 mt-0.5" />
                    {detail}
                  </li>
                ))}
              </ul>

              {isPayoutStep && (
                <div className="mt-8 rounded-xl border border-[#f0d99b] bg-[#fffaf0] p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Payout status: {payoutLabel}</p>
                      <p className="text-xs text-muted mt-1 leading-5">{payoutDescription}</p>
                    </div>
                    {payoutStatus !== "active" && payoutStatus !== "unavailable" && (
                      <button
                        type="button"
                        onClick={handlePayoutSetup}
                        disabled={payoutStarting}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-xs font-medium text-white transition-all hover:bg-ink/90 disabled:opacity-60"
                      >
                        {payoutStarting ? "Opening setup..." : payoutStatus === "pending" ? "Resume setup" : "Set up payouts"}
                        {!payoutStarting && <ExternalLink size={14} />}
                      </button>
                    )}
                  </div>
                  {payoutError && <p role="alert" className="text-xs text-red-700 mt-3">{payoutError}</p>}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 mt-12 pt-6 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                {isLastStep ? (
                  <Link
                    href="/dashboard/products/new"
                    onClick={finishGuide}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white transition-all hover:bg-ink/90 active:scale-[0.98]"
                  >
                    Create your first product
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((value) => Math.min(guideSteps.length - 1, value + 1))}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white transition-all hover:bg-ink/90 active:scale-[0.98]"
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
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
        <WelcomeState userName={userName} payoutStatus={payoutStatus} />
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
