"use client";

import Link from "next/link";
import { useState } from "react";

const MOCK_PRODUCTS = [
  {
    id: "mock-1",
    name: "Summer Nights",
    description: "A smooth melodic production for late-night records.",
    price_amount: 1500000,
    status: "published" as const,
    cover_image_url: "/midnight-drive-cover.png",
    public_id: "summer-nights",
    sales: 45,
  },
  {
    id: "mock-2",
    name: "Lagos Vibes",
    description: "Upbeat Afrobeat instrumental with infectious rhythms.",
    price_amount: 2000000,
    status: "published" as const,
    cover_image_url: null,
    public_id: "lagos-vibes",
    sales: 28,
  },
  {
    id: "mock-3",
    name: "Midnight Drive Type Beat",
    description: "Moody, atmospheric beat for late night sessions.",
    price_amount: 2900000,
    status: "draft" as const,
    cover_image_url: null,
    public_id: "midnight-drive",
    sales: 0,
  },
];

const RECENT_SALES = [
  {
    id: "s1",
    product_name: "Summer Nights",
    buyer_email: "a***@gmail.com",
    amount: 15000,
    time: "2 mins ago",
    cover_image: "/midnight-drive-cover.png",
    has_image: true,
  },
  {
    id: "s2",
    product_name: "Lagos Vibes",
    buyer_email: "j***@company.com",
    amount: 20000,
    time: "1 hour ago",
    cover_image: null,
    icon: "music_note",
    has_image: false,
  },
  {
    id: "s3",
    product_name: "Summer Nights",
    buyer_email: "s***@design.studio",
    amount: 15000,
    time: "3 hours ago",
    cover_image: "/midnight-drive-cover.png",
    has_image: true,
  },
];

function formatNaira(amountInKobo: number): string {
  const naira = amountInKobo / 100;
  return `\u20A6${naira.toLocaleString("en-NG")}`;
}

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [products] = useState(MOCK_PRODUCTS);

  const totalSalesRevenue = products.reduce((sum, p) => sum + p.price_amount * p.sales, 0);
  const activeProducts = products.filter((p) => p.status === "published").length;

  const navItems = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "catalog", icon: "library_music", label: "Catalog" },
    { id: "sales", icon: "payments", label: "Sales" },
    { id: "analytics", icon: "bar_chart", label: "Analytics" },
    { id: "settings", icon: "settings", label: "Settings" },
  ];

  const bottomNavItems = [
    { id: "support", icon: "help", label: "Support" },
    { id: "signout", icon: "logout", label: "Sign Out" },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      {/* Side Navigation */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen p-4 bg-[#F1F5F9] border-r border-gray-200 w-64 z-40">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <img
            src="/logo.png"
            alt="Dropcue"
            className="h-8 w-8 object-contain rounded-md"
          />
          <div>
            <h2 className="font-semibold text-[18px] text-[#4338CA]">Creator Hub</h2>
            <p className="text-[12px] text-[#5c5f61]">Pro Account</p>
          </div>
        </div>

        {/* New Release Button */}
        <button className="mb-8 w-full bg-[#4338CA] hover:bg-[#18008f] text-white text-[14px] font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>
          New Release
        </button>

        {/* Main Nav */}
        <div className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
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
              <span className={`material-symbols-outlined ${activeNav === item.id ? "filled" : ""}`}>
                {item.icon}
              </span>
              <span className="text-[14px] font-medium">{item.label}</span>
            </a>
          ))}
        </div>

        {/* Bottom Nav */}
        <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-gray-200">
          {bottomNavItems.map((item) => (
            <a
              key={item.id}
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-[#5c5f61] hover:text-[#0b1c30] hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-[14px] font-medium">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between lg:px-8">
          {/* Mobile Logo */}
          <div className="flex items-center gap-4 md:hidden">
            <img src="/logo.png" alt="Dropcue" className="h-8 object-contain" />
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
                <span className="text-[14px] font-medium text-[#5c5f61]">Total Sales</span>
                <span className="material-symbols-outlined text-[#5c5f61] text-sm">trending_up</span>
              </div>
              <div>
                <div className="text-[24px] font-semibold text-[#0b1c30]">{formatNaira(totalSalesRevenue)}</div>
                <div className="text-[12px] text-[#10B981] mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  +14.5% from last month
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
                <div className="text-[24px] font-semibold text-[#0b1c30]">{activeProducts}</div>
                <div className="text-[12px] text-[#5c5f61] mt-1">Across 3 categories</div>
              </div>
            </div>

            {/* Total Customers */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-[#4338CA] transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-medium text-[#5c5f61]">Total Customers</span>
                <span className="material-symbols-outlined text-[#5c5f61] text-sm">group</span>
              </div>
              <div>
                <div className="text-[24px] font-semibold text-[#0b1c30]">1,284</div>
                <div className="text-[12px] text-[#10B981] mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  +5.2% from last month
                </div>
              </div>
            </div>
          </div>

          {/* Latest Sales */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#F1F5F9]/50">
              <h3 className="text-[18px] font-semibold text-[#0b1c30]">Latest Sales</h3>
              <button className="text-[14px] font-medium text-[#4338CA] hover:underline">View All</button>
            </div>
            <div className="flex flex-col divide-y divide-gray-200">
              {RECENT_SALES.map((sale) => (
                <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {sale.has_image ? (
                      <img
                        src={sale.cover_image}
                        alt={sale.product_name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 text-[#5c5f61]">
                        <span className="material-symbols-outlined">{sale.icon}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-[14px] font-semibold text-[#0b1c30]">{sale.product_name}</p>
                      <p className="text-[12px] text-[#5c5f61]">{sale.buyer_email} • {sale.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-semibold text-[#0b1c30]">{formatNaira(sale.amount * 100)}</span>
                    <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-[14px] font-medium text-[#5c5f61] hover:text-[#4338CA] hover:border-[#4338CA] transition-colors bg-white hidden md:block">
                      View
                    </button>
                    <button className="md:hidden text-[#5c5f61]">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                </div>
              ))}
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
