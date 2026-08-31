import { notFound}
 from "next/navigation";
import { getPublicProduct}
 from "@/modules/products/server/actions";
import { formatDisplayPrice, createMoney}
 from "@/lib/money/types";
import { CheckoutForm}
 from "@/components/checkout/checkout-form";

interface Props {
  params: Promise<{ publicId: string}
>;
}

export async function generateMetadata({ params}
: Props) {
  const { publicId}
 = await params;
  const { product}
 = await getPublicProduct(publicId);

  if (!product) {
    return { title: "Product Not Found"}
;
 }


  return {
    title: `${product.name} — Dropcue`,
    description: product.description ?? `Buy ${product.name} on Dropcue`,
 }
;
}

export default async function PublicProductPage({ params}
: Props) {
  const { publicId}
 = await params;
  const { product}
 = await getPublicProduct(publicId);

  if (!product) {
    notFound();
    return null;
 }


  const displayPrice = formatDisplayPrice(createMoney(product.price_amount));

  return (
    <>
      {/* Header */}
      <header className="w-full h-16 bg-white border-b border-gray-200 flex items-center px-6 md:px-16 shrink-0 sticky top-0 z-50">
        <div className="max-w-[1120px] mx-auto w-full flex justify-center md:justify-start">
          <img
            src="/logo.png"
            alt="Dropcue"
            className="h-12 w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full py-16 px-4 md:px-6 bg-[#F8FAFC]">
        <div className="max-w-[1120px] mx-auto h-full flex items-center justify-center">
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 max-w-[1000px]">
            {/* Left: Visuals */}
            <div className="md:col-span-7 flex flex-col gap-4">
              {/* Cover Art */}
              <div className="relative w-full aspect-square md:aspect-[4/3] rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                {product.cover_image_url ? (
                  <img
                    src={product.cover_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="material-symbols-outlined text-[#4338CA] text-[64px]">
                      audio_file
                    </span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#4338CA]">
                    music_note
                  </span>
                  <span className="text-[13px] font-semibold text-[#141416]">
                    Premium Beat
                  </span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm text-[14px] text-[#6e6e73]">
                <span className="material-symbols-outlined text-[#4338CA] text-[20px]">
                  lock
                </span>
                Files become available after payment is verified.
              </div>
            </div>

            {/* Right: Details & Checkout */}
            <div className="md:col-span-5 flex flex-col">
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col h-full sticky top-32">
                {/* Header & Price */}
                <div className="mb-4 border-b border-gray-200 pb-4">
                  <h1 className="text-[32px] md:text-[40px] font-bold text-[#141416] mb-2 leading-tight">
                    {product.name}
                  </h1>
                  <p className="text-[20px] font-semibold text-[#6e6e73]">
                    {displayPrice}
                  </p>
                </div>

                {/* Description */}
                <div className="mb-6 flex-grow">
                  {product.description && (
                    <p className="text-[15px] leading-relaxed text-[#6e6e73] mb-4">
                      {product.description}
                    </p>
                  )}

                  {/* Included Files */}
                  {product.files.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200/50">
                      <h3 className="text-[14px] font-medium text-[#141416] mb-2 px-2 pt-1">
                        Included Assets ({product.files.length})
                      </h3>
                      <ul className="flex flex-col gap-1">
                        {product.files.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center gap-3 p-2 text-[#6e6e73] rounded-md"
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
                  )}
                </div>

                {/* Checkout Form */}
                <CheckoutForm productId={product.id} productName={product.name} />

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-4 mt-4 opacity-80">
                  <div className="flex items-center gap-1.5 text-[#6e6e73]">
                    <span className="material-symbols-outlined text-[16px]">
                      lock
                    </span>
                    <span className="text-[12px]">Secure checkout</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <div className="flex items-center gap-1.5 text-[#6e6e73]">
                    <span className="material-symbols-outlined text-[16px]">
                      bolt
                    </span>
                    <span className="text-[12px]">Secure delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>  );
}
