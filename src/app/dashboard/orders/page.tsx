"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 20;

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

interface OrderStats {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
}

/* Shape returned by the get_creator_order_stats() RPC — one round-trip for
   all page stats (see supabase/migrations/003_order_stats_rpc.sql) */
interface OrderStatsRpc {
  total_revenue: number | string | null;
  total_orders: number | string | null;
  paid_orders: number | string | null;
  pending_orders: number | string | null;
  failed_orders: number | string | null;
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
  const [stats, setStats] = useState<OrderStats>({
    totalRevenue: 0,
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    failedOrders: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "failed">("all");
  const [page, setPage] = useState(0);
  const [totalForFilter, setTotalForFilter] = useState(0);
  const requestSeq = useRef(0);
  const userIdRef = useRef<string | null>(null);

  /* ── Aggregate stats: loaded ONCE (never per page) ─────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        userIdRef.current = user.id;

        /* Preferred: ONE round-trip via RPC */
        const { data: rpcData, error: rpcError } = await supabase
          .rpc("get_creator_order_stats")
          .single();

        if (!rpcError && rpcData) {
          const row = rpcData as OrderStatsRpc;
          if (!cancelled) {
            setStats({
              totalRevenue: Number(row.total_revenue ?? 0),
              totalOrders: Number(row.total_orders ?? 0),
              paidOrders: Number(row.paid_orders ?? 0),
              pendingOrders: Number(row.pending_orders ?? 0),
              failedOrders: Number(row.failed_orders ?? 0),
            });
          }
          return;
        }

        /* Fallback: 5 tiny queries in parallel — head counts (no rows
           transferred; RLS scopes to the creator's own orders) + one slim
           revenue query (single column, no pagination needed for the sum
           of one column to be exact). */
        const [allRes, paidRes, pendingRes, failedRes, revenueRes] =
          await Promise.all([
            supabase
              .from("orders")
              .select("id", { count: "exact", head: true }),
            supabase
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("status", "paid"),
            supabase
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending"),
            supabase
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("status", "failed"),
            supabase
              .from("orders")
              .select("amount")
              .eq("status", "paid"),
          ]);

        if (cancelled) return;
        const revenue = (revenueRes.data ?? []).reduce(
          (sum: number, r: { amount: number }) => sum + Number(r.amount),
          0
        );
        setStats({
          totalRevenue: revenue,
          totalOrders: allRes.count ?? 0,
          paidOrders: paidRes.count ?? 0,
          pendingOrders: pendingRes.count ?? 0,
          failedOrders: failedRes.count ?? 0,
        });
      } catch (err) {
        console.error("Failed to load order stats:", err);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── One page of orders for the current filter ─────────────────────── */
  useEffect(() => {
    const seq = ++requestSeq.current;

    async function loadOrders() {
      try {
        const supabase = createClient();
        let userId = userIdRef.current;
        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          userId = user.id;
          userIdRef.current = userId;
        }

        setLoading(true);

        /* Single round-trip: page rows + exact total count for the filter */
        let query = supabase
          .from("orders")
          .select("*, products!inner(name, public_id)", { count: "exact" })
          .eq("products.creator_id", userId)
          .order("created_at", { ascending: false })
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

        if (filter !== "all") query = query.eq("status", filter);

        const { data, count } = await query;
        if (seq !== requestSeq.current) return; // stale response — ignore

        setOrders((data ?? []) as unknown as Order[]);
        setTotalForFilter(count ?? 0);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }

    loadOrders();
  }, [page, filter]);

  const totalPages = Math.max(1, Math.ceil(totalForFilter / PAGE_SIZE));
  const canPrev = page > 0 && !loading;
  const canNext = (page + 1) * PAGE_SIZE < totalForFilter && !loading;
  const rangeStart = totalForFilter === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, totalForFilter);

  const changeFilter = (f: typeof filter) => {
    if (f === filter) return;
    setFilter(f);
    setPage(0); // reset to first page on filter change
  };

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
              {statsLoading ? "—" : formatNaira(stats.totalRevenue)}
            </p>
          </div>
          <div className="bg-surface p-5 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline">
            <p className="text-xs font-medium text-muted mb-1">Total Orders</p>
            <p className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-geist)]">
              {statsLoading ? "—" : stats.totalOrders}
            </p>
          </div>
          <div className="bg-surface p-5 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline">
            <p className="text-xs font-medium text-muted mb-1">Paid Orders</p>
            <p className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-geist)]">
              {statsLoading ? "—" : stats.paidOrders}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "paid", "pending", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? "bg-ink text-white"
                  : "bg-surface border border-hairline text-muted hover:text-ink hover:border-ink/20"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "all" && statsLoading ? "" : ` (${f === "all" ? stats.totalOrders : f === "paid" ? stats.paidOrders : f === "pending" ? stats.pendingOrders : stats.failedOrders})`}
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
        ) : orders.length === 0 ? (
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
          <>
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
                {orders.map((order) => (
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

            {/* Pagination */}
            {totalForFilter > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted">
                  Showing <span className="font-medium text-ink">{rangeStart}–{rangeEnd}</span> of{" "}
                  <span className="font-medium text-ink">{totalForFilter}</span>{" "}
                  {filter === "all" ? "orders" : `${filter} orders`}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={!canPrev}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-surface border border-hairline text-muted hover:text-ink hover:border-ink/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted disabled:hover:border-hairline"
                  >
                    <i className="fa-solid fa-chevron-left text-[10px]" />
                    Prev
                  </button>
                  <span className="text-xs text-muted">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!canNext}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-surface border border-hairline text-muted hover:text-ink hover:border-ink/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted disabled:hover:border-hairline"
                  >
                    Next
                    <i className="fa-solid fa-chevron-right text-[10px]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
