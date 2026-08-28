"use client";

import { useState } from "react";

const DEMO_PRODUCTS = [
  {
    name: "Midnight Drive Type Beat",
    price: "$29",
    status: "published" as const,
    sales: 12,
    icon: "fa-solid fa-music",
  },
  {
    name: "Lo-Fi Sample Pack Vol. 3",
    price: "$19",
    status: "published" as const,
    sales: 8,
    icon: "fa-solid fa-headphones",
  },
  {
    name: "Vocal Chops Collection",
    price: "$14",
    status: "draft" as const,
    sales: 0,
    icon: "fa-solid fa-microphone",
  },
];

const STATS = [
  { label: "Total Revenue", value: "$487", change: "+12%" },
  { label: "Products", value: "3", change: "" },
  { label: "Downloads", value: "20", change: "+8" },
];

export function DashboardDemo() {
  const [activeTab, setActiveTab] = useState<"products" | "analytics">(
    "products"
  );

  return (
    <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline overflow-hidden">
      {/* Mini Nav */}
      <div className="h-12 border-b border-hairline flex items-center px-5 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
            <i className="fa-solid fa-music text-white text-[10px]" />
          </div>
          <span className="text-sm font-semibold text-ink">Dashboard</span>
        </div>
        <button className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium">
          + New Product
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 border-b border-hairline">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="p-4 text-center border-r border-hairline last:border-r-0"
          >
            <p className="text-xs text-muted">{s.label}</p>
            <p className="text-lg font-semibold text-ink mt-1">{s.value}</p>
            {s.change && (
              <p className="text-xs text-green-600 mt-0.5">{s.change}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hairline">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "products"
              ? "text-accent border-b-2 border-accent"
              : "text-muted hover:text-ink"
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "analytics"
              ? "text-accent border-b-2 border-accent"
              : "text-muted hover:text-ink"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {activeTab === "products" ? (
          DEMO_PRODUCTS.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-3 p-3 rounded-xl border border-hairline hover:border-accent/30 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  p.status === "published"
                    ? "bg-accent/10 text-accent"
                    : "bg-gray-100 text-muted"
                }`}
              >
                <i className={`${p.icon} text-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {p.name}
                </p>
                <p className="text-xs text-muted">
                  {p.price} • {p.sales} sales
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  p.status === "published"
                    ? "bg-green-50 text-green-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {p.status}
              </span>
            </div>
          ))
        ) : (
          <div className="space-y-3">
            <div className="h-24 bg-gray-50 rounded-xl border border-hairline flex items-end px-4 pb-3 gap-2">
              {[40, 65, 30, 80, 55, 70, 90, 45, 75, 60, 85, 50].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-accent/20 rounded-t hover:bg-accent/40 transition-colors"
                    style={{ height: `${h}%` }}
                  />
                )
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted px-1">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
