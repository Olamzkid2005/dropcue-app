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

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeProducts: 0,
    totalOrders: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch products
        const { data: products } = await supabase
          .from("products")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false });

        // Fetch orders for user's products
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
        });
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const navItems = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard", href: "/dashboard" },
    { id: "catalog", icon: "library_music", label: "Catalog", href: "/dashboard" },
    { id: "sales", icon: "payments", label: "Sales", href: "/dashboard" },
    { id: "analytics", icon: "bar_chart", label: "Analytics", href: "/dashboard" },
    { id: "settings", icon: "settings", label: "Settings", href: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      {/* Side Navigation */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen p-4 bg-[#F1F5F9] border-r border-gray-200 w-64 z-40">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <Link href="/">
            <img
              src="/logo.png"
              alt="Dropcue"
              className="h-8 w-8 object-contain rounded-md"
            />
          </Link>
          <div>
            <h2 className="font-semibold text-[18px] text-[#4338CA]">Creator Hub</h2>
            <p className="text-[12px] text-[#5c5f61]">Pro Account</p>
          </div>
        </div>

        {/* New Release Button */}
        <Link
          href="/products/new"
          className="mb-8 w-full bg-[#4338CA] hover:bg-[#18008f] text-white text-[14px] font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Product
        </Link>

        {/* Main Nav */}
        <div className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                setActiveNav(item.id);
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                activeNav === item.id
                  ? "bg-white text-[#4338CA] shadow-sm"
                  : "text-[#5c5f61] hover:text-[#0b1c30] hover:bg-gray-100"
              }`}
            >
              <span className={`material-symbols-outlined ${activeNav === "dashboard" ? "filled" : ""}`}>
                {item.icon}
              </span>
              <span className="text-[14px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Bottom Nav */}
        <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-gray-200">
          <a
            href="https://dropcue.co/help"
            className="flex items-center gap-3 px-3 py-2 text-[#5c5f61] hover:text-[#0b1c30] hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="text-[14px] font-medium">Support</span>
          </a>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="flex items-center gap-3 px-3 py-2 text-[#5c5f61] hover:text-[#0b1c30] hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-[14px] font-medium">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between lg:px-8">
          {/* Mobile Logo */}
          <div className="flex items-center gap-4 md:hidden">
            <Link href="/">
              <img src="/logo.png" alt="Dropcue" className="h-8 object-contain" />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md items-center relative">
            <span className="material-symbols-outlined absolute left-3 text-[#5c5f61] text-lg">search</span>
            <input
              type="text"
              placeholder="Search products, sales..."
              className="w-full pl-10 pr-4 py-2 bg-[#F1F5F9] border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-shadow"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 ml-auto">
            <button className="text-[#5c5f61] hover:text-[#4338CA] transition-colors p-2 rounded-full hover:bg-gray-100">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gray-200 border border-gray-200 overflow-hidden cursor-pointer flex items-center justify-center">
              <span className="material-symbols-outlined text-[#4338CA] text-sm">person</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 lg:p-8 max-w-[1120px] mx-auto w-full flex flex-col gap-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-[32px] md:text-[48px] font-bold text-[#0b1c30] leading-tight tracking-tight">
                Overview
              </h1>
              <p className="text-[18px] text-[#5c5f61] mt-2">
                Here&apos;s what&apos;s happening with your products today.
              </p>
            </div>
            <Link
              href="/products/new"
              className="bg-[#4338CA] text-white text-[14px] font-medium px-6 py-3 rounded-xl hover:bg-[#18008f] transition-colors shadow-sm flex items-center gap-2 w-fit"
            >
              <span className="material-symbols-outlined">add</span>
              Create Product
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Sales Revenue */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-[#4338CA] transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-medium text-[#5c5f61]">Total Revenue</span>
                <span className="material-symbols-outlined text-[#5c5f61] text-sm">trending_up</span>
              </div>
              <div>
                <div className="text-[24px] font-semibold text-[#0b1c30]">
                  {loading ? "---" : formatNaira(stats.totalRevenue)}
                </div>
                <div className="text-[12px] text-[#10B981] mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  From completed sales
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-12 opacity-20 bg-gradient-to-t from-[#4338CA] to-transparent translate-y-4 group-hover:translate-y-0 transition-transform" />
            </div>

            {/* Active Products */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-[#4338CA] transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-medium text-[#5c5f61]">Active Products</span>
                <span className="material-symbols-outlined text-[#5c5f61] text-sm">inventory_2</span>
              </div>
              <div>
                <div className="text-[24px] font-semibold text-[#0b1c30]">
                  {loading ? "---" : stats.activeProducts}
                </div>
                <div className="text-[12px] text-[#5c5f61] mt-1">Published and live</div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-[#4338CA] transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-medium text-[#5c5f61]">Total Orders</span>
                <span className="material-symbols-outlined text-[#5c5f61] text-sm">group</span>
              </div>
              <div>
                <div className="text-[24px] font-semibold text-[#0b1c30]">
                  {loading ? "---" : stats.totalOrders}
                </div>
                <div className="text-[12px] text-[#5c5f61] mt-1">Across all products</div>
              </div>
            </div>
          </div>

          {/* Latest Sales */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#F1F5F9]/50">
              <h3 className="text-[18px] font-semibold text-[#0b1c30]">Latest Orders</h3>
              <Link href="/dashboard" className="text-[14px] font-medium text-[#4338CA] hover:underline">
                View All
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-gray-200">
              {loading ? (
                <div className="p-8 text-center text-[#5c5f61] text-[14px]">
                  Loading orders...
                </div>
              ) : stats.recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-[#5c5f61] text-[48px] mb-2 block">
                    receipts
                  </span>
                  <p className="text-[16px] font-medium text-[#0b1c30] mb-1">No orders yet</p>
                  <p className="text-[14px] text-[#5c5f61]">
                    Create your first product to start receiving orders.
                  </p>
                </div>
              ) : (
                stats.recentOrders.map((sale) => (
                  <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#4338CA]/10 flex items-center justify-center border border-gray-200">
                        <span className="material-symbols-outlined text-[#4338CA]">
                          {sale.status === "paid" ? "check_circle" : "schedule"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#0b1c30]">
                          {sale.products?.name ?? "Product"}
                        </p>
                        <p className="text-[12px] text-[#5c5f61]">
                          {sale.buyer_email} &bull; {timeAgo(sale.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-semibold text-[#0b1c30]">
                        {formatNaira(sale.amount)}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          sale.status === "paid"
                            ? "bg-green-50 text-green-700"
                            : sale.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#F1F5F9] border-t border-gray-200 mt-auto">
          <p className="text-[12px] text-[#5c5f61]">&copy; 2024 Dropcue. Premium Digital Delivery.</p>
          <div className="flex gap-4">
            {["Terms", "Privacy", "Help Center", "API"].map((link) => (
              <a key={link} href="#" className="text-[12px] text-[#5c5f61] hover:text-[#4338CA] transition-colors">
                {link}
              </a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
