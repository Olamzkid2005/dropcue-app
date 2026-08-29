"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Order {
  id: string;
  public_id: string;
  product_id: string;
  buyer_email: string;
  amount: number;
  currency: string;
  status: string;
  payment_provider: string;
  created_at: string;
  products?: { name: string; public_id: string } | null;
}

function formatNaira(amountInKobo: number): string {
  const naira = amountInKobo / 100;
  return `\u20A6${naira.toLocaleString("en-NG")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  useEffect(() => {
    async function loadOrders() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get products first
        const { data: products } = await supabase
          .from("products")
          .select("id")
          .eq("creator_id", user.id);

        const productIds = (products ?? []).map((p) => p.id);
        if (productIds.length === 0) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("orders")
          .select("*, products(name, public_id)")
          .in("product_id", productIds)
          .order("created_at", { ascending: false });

        setOrders((data ?? []) as Order[]);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
        <div className="flex items-center justify-between h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
          <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">Orders</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 lg:p-10 max-w-[1200px] mx-auto w-full flex flex-col gap-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface p-5 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline">
            <p className="text-xs font-medium text-muted mb-1">Total Revenue</p>
            <p className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-geist)]">
              {loading ? "—" : formatNaira(totalRevenue)}
            </p>
          </div>
          <div className="bg-surface p-5 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline">
            <p className="text-xs font-medium text-muted mb-1">Total Orders</p>
            <p className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-geist)]">
              {loading ? "—" : orders.length}
            </p>
          </div>
          <div className="bg-surface p-5 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline">
            <p className="text-xs font-medium text-muted mb-1">Paid Orders</p>
            <p className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-geist)]">
              {loading ? "—" : orders.filter((o) => o.status === "paid").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {(["all", "paid", "pending", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? "bg-ink text-white"
                  : "bg-surface border border-hairline text-muted hover:text-ink hover:border-ink/20"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "all" && ` (${orders.length})`}
              {f === "paid" && ` (${orders.filter((o) => o.status === "paid").length})`}
              {f === "pending" && ` (${orders.filter((o) => o.status === "pending").length})`}
              {f === "failed" && ` (${orders.filter((o) => o.status === "failed").length})`}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-8">
            <div className="flex items-center justify-center gap-3 text-muted text-sm">
              <i className="fa-solid fa-spinner fa-spin" />
              Loading orders...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-16 text-center">
            <div className="w-20 h-20 bg-hairline/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-receipt text-3xl text-muted" />
            </div>
            <h3 className="text-xl font-semibold font-[family-name:var(--font-geist)] mb-2">
              {filter === "all" ? "No orders yet" : `No ${filter} orders`}
            </h3>
            <p className="text-muted max-w-sm mx-auto">
              {filter === "all"
                ? "Orders will appear here once buyers purchase your products."
                : `No orders with ${filter} status.`}
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline overflow-hidden">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-hairline bg-paper/50 text-xs font-medium text-muted uppercase tracking-wider">
              <div className="col-span-5">Product</div>
              <div className="col-span-3">Buyer</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-hairline">
              {filtered.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 hover:bg-paper/50 transition-colors items-center"
                >
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-receipt text-accent text-xs" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {order.products?.name ?? "Product"}
                      </p>
                      <p className="text-xs text-muted truncate">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <p className="text-sm text-muted truncate">{order.buyer_email}</p>
                  </div>
                  <div className="sm:col-span-2 text-right">
                    <span className="text-sm font-semibold">{formatNaira(order.amount)}</span>
                  </div>
                  <div className="sm:col-span-2 flex justify-start sm:justify-end">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
