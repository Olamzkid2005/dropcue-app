"use client";

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

      {/* Content */}
      <div className="p-4 space-y-3">
        {DEMO_PRODUCTS.map((p) => (
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
          ))}
      </div>
    </div>
  );
}
