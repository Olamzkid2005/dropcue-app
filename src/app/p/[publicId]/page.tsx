import { notFound } from "next/navigation";
import { getPublicProduct } from "@/modules/products/server/actions";
import { formatDisplayPrice, createMoney } from "@/lib/money/types";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { publicId } = await params;
    const { product } = await getPublicProduct(publicId);

    if (!product) {
      return { title: "Product Not Found" };
    }

    return {
      title: `${product.name} — Dropcue`,
      description:
        product.description || `Buy ${product.name} securely and download instantly`,
      openGraph: {
        title: `${product.name} — Dropcue`,
        description: "Buy securely and download instantly",
        type: "website",
        ...(product.cover_image_url && { images: [product.cover_image_url] }),
      },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function PublicProductPage({ params }: Props) {
  let product;

  try {
    const { publicId } = await params;
    const result = await getPublicProduct(publicId);
    product = result.product;
  } catch {
    notFound();
  }

  if (!product) notFound();

  return (
    <>
      {/* Minimal Header */}
      <header className="w-full h-16 bg-surface-studio border-b border-outline-variant flex items-center px-6 md:px-16 shrink-0 sticky top-0 z-50">
        <div className="max-w-[1120px] mx-auto w-full flex justify-center md:justify-start">
          <img
            src="/logo.png"
            alt="Dropcue"
            className="h-[72px] w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full py-16 px-4 md:px-6">
        <div className="max-w-[1120px] mx-auto h-full flex items-center justify-center">
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 max-w-[1000px]">
            {/* Left: Visuals */}
            <div className="md:col-span-7 flex flex-col gap-4">
              {/* Cover Art */}
              <div className="relative w-full aspect-square md:aspect-[4/3] rounded-xl overflow-hidden bg-surface-studio border border-outline-variant shadow-sm">
                {product.cover_image_url ? (
                  <img
                    src={product.cover_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                    <span className="material-symbols-outlined text-accent-indigo text-[64px]">
                      audio_file
                    </span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-surface-studio/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-accent-indigo">
                    music_note
                  </span>
                  <span className="text-[13px] font-semibold text-on-surface">
                    Premium Beat
                  </span>
                </div>
              </div>

              {/* Audio Player Placeholder */}
              <div className="bg-surface-studio border border-outline-variant rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <button className="w-12 h-12 rounded-full bg-accent-indigo text-on-primary flex items-center justify-center shrink-0 hover:bg-primary-container transition-colors">
                  <span className="material-symbols-outlined text-[24px]">
                    play_arrow
                  </span>
                </button>
                <div className="flex-grow flex items-center h-8 gap-[2px] opacity-70">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full ${
                        i < 13 ? "bg-accent-indigo" : "bg-primary-fixed-dim"
                      }`}
                      style={{
                        height: `${Math.floor(Math.random() * 80) + 20}%`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-secondary shrink-0 w-12 text-right">
                  0:00
                </span>
              </div>
            </div>

            {/* Right: Details & Checkout */}
            <div className="md:col-span-5 flex flex-col">
              <div className="bg-surface-studio border border-outline-variant rounded-xl p-8 shadow-sm flex flex-col h-full sticky top-32">
                {/* Header & Price */}
                <div className="mb-4 border-b border-outline-variant pb-4">
                  <h1 className="font-[family-name:var(--font-geist)] text-[32px] md:text-[48px] font-bold text-on-surface mb-2 leading-tight">
                    {product.name}
                  </h1>
                  <p className="font-[family-name:var(--font-geist)] text-[24px] font-semibold text-secondary">
                    {formatDisplayPrice(createMoney(product.price_amount))}
                  </p>
                </div>

                {/* Description */}
                <div className="mb-8 flex-grow">
                  {product.description && (
                    <p className="text-[16px] leading-relaxed text-secondary mb-4">
                      {product.description}
                    </p>
                  )}

                  {/* Included Files */}
                  <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/50">
                    <h3 className="text-[14px] font-medium text-on-surface mb-2 px-2 pt-1">
                      Included Assets
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {product.files.map((file) => (
                        <li
                          key={file.id}
                          className="flex items-center gap-3 p-2 text-secondary rounded-md"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {file.mime_type.startsWith("audio/")
                              ? "audio_file"
                              : file.mime_type.includes("zip")
                                ? "folder_zip"
                                : "description"}
                          </span>
                          <span className="text-[14px]">
                            {file.original_filename}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Checkout Form */}
                <CheckoutForm
                  productId={product.id}
                  productName={product.name}
                />

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-4 mt-4 opacity-80">
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span className="material-symbols-outlined text-[16px]">
                      lock
                    </span>
                    <span className="text-[12px]">Secure checkout</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-outline-variant" />
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span className="material-symbols-outlined text-[16px]">
                      bolt
                    </span>
                    <span className="text-[12px]">Instant delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
