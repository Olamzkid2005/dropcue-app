import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/modules/products/server/actions";
import { AppLayout } from "@/components/app-layout";

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes("placeholder") && !key.includes("placeholder"));
}

function formatPrice(amountInKobo: number): string {
  const naira = amountInKobo / 100;
  return `₦${naira.toLocaleString("en-NG")}`;
}

function statusChip(status: string) {
  if (status === "published") {
    return (
      <div className="bg-[#ECFDF5] text-success-green px-2 py-1 rounded-full text-[13px] font-semibold flex items-center gap-1 border border-[#D1FAE5]">
        <span className="material-symbols-outlined text-[14px]">
          check_circle
        </span>
        Published
      </div>
    );
  }
  if (status === "draft") {
    return (
      <div className="bg-[#FFFBEB] text-[#B45309] px-2 py-1 rounded-full text-[13px] font-semibold flex items-center gap-1 border border-[#FEF3C7]">
        <span className="material-symbols-outlined text-[14px]">
          edit_note
        </span>
        Draft
      </div>
    );
  }
  return (
    <div className="bg-surface-container-lowest text-secondary px-2 py-1 rounded-full text-[13px] font-semibold flex items-center gap-1 border border-outline-variant">
      <span className="material-symbols-outlined text-[14px]">archive</span>
      Archived
    </div>
  );
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { products } = await getProducts();

  return (
    <AppLayout>
      <div className="max-w-[1120px] mx-auto px-4 md:px-6 mt-16 pb-16">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-geist)] text-[32px] md:text-[48px] font-bold text-on-surface leading-tight">
              Products
            </h1>
            <p className="text-[16px] leading-relaxed text-secondary mt-2">
              Manage your digital products, tracks, and sound kits.
            </p>
          </div>
          <Link
            href="/products/new"
            className="md:hidden w-full bg-accent-indigo text-white px-4 py-3 rounded-lg text-[14px] font-medium flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Product
          </Link>
        </header>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-secondary text-[16px]">
              No products yet. Create your first product to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <article
                key={product.id}
                className={`bg-surface-studio border rounded-xl p-4 transition-all duration-200 flex flex-col h-full ${
                  product.status === "draft"
                    ? "border-dashed border-outline opacity-80 hover:opacity-100"
                    : "border-outline-variant hover:border-outline"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      product.status === "published"
                        ? "bg-surface-container text-accent-indigo"
                        : "bg-surface-container-highest text-secondary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {product.status === "published" ? "audio_file" : "draft"}
                    </span>
                  </div>
                  {statusChip(product.status)}
                </div>
                <h2 className="font-[family-name:var(--font-geist)] text-[18px] font-semibold text-on-surface mb-1">
                  {product.name}
                </h2>
                <p className="text-[16px] leading-relaxed text-secondary mb-8 line-clamp-2 flex-grow">
                  {product.description || "No description"}
                </p>
                <div className="border-t border-outline-variant pt-4 mt-auto">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-[family-name:var(--font-geist)] text-[24px] font-semibold text-on-surface">
                      {product.status === "draft"
                        ? "--"
                        : formatPrice(product.price_amount)}
                    </span>
                    <span className="text-[12px] text-secondary">0 Sales</span>
                  </div>
                  <Link
                    href={`/products/${product.id}`}
                    className="w-full bg-surface-studio border border-outline-variant hover:border-accent-indigo hover:text-accent-indigo text-on-surface py-2 rounded-lg text-[14px] font-medium transition-colors text-center block"
                  >
                    {product.status === "draft" ? "Continue Editing" : "View"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
