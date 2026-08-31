"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProduct, deleteProduct } from "@/modules/products/server/actions";
import { FileUpload } from "@/components/products/file-upload";
import { amountInWords, formatNairaInput } from "@/lib/money/types";

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  status: string;
  public_id: string;
  cover_image_url: string | null;
  created_at: string;
}

interface ProductFile {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: string;
}

function PublishedConfirmation({
  product,
  onCreateAnother,
  onDashboard,
}: {
  product: ProductData;
  onCreateAnother: () => void;
  onDashboard: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window === "undefined"
      ? `/p/${product.public_id}`
      : `${window.location.origin}/p/${product.public_id}`;
  const price = `₦${(product.price_amount / 100).toLocaleString("en-NG")}`;

  async function copyLink() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("textarea");
        input.value = shareUrl;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const shareText = `Check out ${product.name}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper flex items-center justify-center p-5 lg:p-10">
      <div className="w-full max-w-[640px] bg-surface border border-hairline rounded-xl shadow-soft overflow-hidden">
        <section className="flex flex-col items-center text-center px-6 py-12 border-b border-hairline bg-surface">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
            <i className="fa-solid fa-check text-2xl" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold font-[family-name:var(--font-geist)] mb-2">
            You&apos;re live!
          </h1>
          <p className="text-muted max-w-sm">
            Your product has been successfully published and is now available to the public.
          </p>
        </section>

        <section className="p-6 lg:p-8 bg-paper/50">
          <div className="bg-surface border border-hairline rounded-xl p-4 flex items-center gap-4 shadow-soft mb-7">
            <div className="w-24 h-24 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 overflow-hidden">
              {product.cover_image_url ? (
                <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <i className="fa-solid fa-box-open text-2xl text-accent" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 text-accent px-2 py-1 text-xs font-medium mb-2">
                <i className="fa-solid fa-globe text-[10px]" aria-hidden="true" />
                Published
              </span>
              <h2 className="font-[family-name:var(--font-geist)] text-base font-semibold truncate">
                {product.name}
              </h2>
              <p className="text-xs text-muted mt-1">Digital product</p>
              <p className="text-sm font-medium mt-2">{price}</p>
            </div>
          </div>

          <div className="space-y-2 mb-7">
            <label htmlFor="published-link" className="text-sm font-medium">
              Shareable link
            </label>
            <div className="flex items-stretch border border-hairline rounded-lg overflow-hidden bg-surface focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <div className="px-3 flex items-center border-r border-hairline text-muted" aria-hidden="true">
                <i className="fa-solid fa-link text-sm" />
              </div>
              <input
                id="published-link"
                type="text"
                readOnly
                value={shareUrl}
                className="min-w-0 flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={copyLink}
                className="px-3 py-2 border-l border-hairline text-accent text-sm font-medium hover:bg-accent/5 transition-colors flex items-center gap-2"
              >
                <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`} aria-hidden="true" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-hairline pt-6">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-hairline bg-surface text-muted hover:text-accent hover:border-accent transition-colors text-xs"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-base" aria-hidden="true" />
              View page
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-hairline bg-surface text-muted hover:text-accent hover:border-accent transition-colors text-xs"
            >
              <i className="fa-brands fa-x-twitter text-base" aria-hidden="true" />
              Post to X
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-hairline bg-surface text-muted hover:text-emerald-600 hover:border-emerald-600 transition-colors text-xs"
            >
              <i className="fa-brands fa-whatsapp text-base" aria-hidden="true" />
              WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-hairline bg-surface text-muted hover:text-accent hover:border-accent transition-colors text-xs"
            >
              <i className="fa-solid fa-envelope text-base" aria-hidden="true" />
              Email
            </a>
          </div>
        </section>

        <footer className="p-4 border-t border-hairline bg-surface flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCreateAnother}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Create another
          </button>
          <button
            type="button"
            onClick={onDashboard}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            Back to dashboard
            <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true" />
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [files, setFiles] = useState<ProductFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [publishedProduct, setPublishedProduct] = useState<ProductData | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_amount: 0,
    status: "draft" as string,
  });

  useEffect(() => {
    async function loadProduct() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("products")
          .select("id, name, description, price_amount, status, public_id, cover_image_url, created_at, files(id, original_filename, file_size, mime_type, status)")
          .eq("id", id)
          .eq("creator_id", user.id)
          .single();

        if (data) {
          const productData = data as ProductData & { files?: ProductFile[] };
          setProduct(productData);
          setFiles(productData.files ?? []);
          setForm({
            name: productData.name,
            description: productData.description ?? "",
            price_amount: productData.price_amount / 100,
            status: productData.status,
          });
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setIsSaving(true);
    setError("");
    setSuccess(false);

    const result = await updateProduct(id, {
      name: form.name,
      description: form.description || undefined,
      price_amount: form.price_amount,
      status: form.status as "draft" | "published" | "archived",
    });

    if (result.success) {
      if (form.status === "published") {
        setPublishedProduct({
          ...product,
          name: form.name,
          description: form.description || null,
          price_amount: Math.round(form.price_amount * 100),
          status: "published",
        });
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } else {
      setError(result.error ?? "Failed to update product");
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteProduct(id);
    if (result.success) {
      router.push("/dashboard/products");
    } else {
      setError(result.error ?? "Failed to delete product");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
          <div className="flex items-center h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
            <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">Edit Product</h1>
          </div>
        </header>
        <div className="flex-1 p-6 lg:p-10 max-w-[640px] mx-auto w-full">
          <div className="space-y-6 animate-pulse">
            <div className="h-12 bg-hairline rounded-xl" />
            <div className="h-32 bg-hairline rounded-xl" />
            <div className="h-20 bg-hairline rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
          <div className="flex items-center h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
            <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">Edit Product</h1>
          </div>
        </header>
        <div className="flex-1 p-6 lg:p-10 max-w-[640px] mx-auto w-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-hairline/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-box-open text-3xl text-muted" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Product not found</h3>
            <p className="text-muted mb-6">This product may have been deleted.</p>
            <button onClick={() => router.push("/dashboard/products")} className="bg-ink text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-ink/90 transition-all">
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (publishedProduct) {
    return (
      <PublishedConfirmation
        product={publishedProduct}
        onCreateAnother={() => router.push("/dashboard/products/new")}
        onDashboard={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
        <div className="flex items-center justify-between h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-lg border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/20 transition-all" aria-label="Back">
              <i className="fa-solid fa-arrow-left text-xs" />
            </button>
            <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">Edit Product</h1>
          </div>
          <a href={`/p/${product.public_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 border border-hairline rounded-lg text-sm font-medium text-muted hover:text-ink hover:border-ink/20 transition-all">
            <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
            View
          </a>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-10 max-w-[640px] mx-auto w-full flex flex-col gap-8">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${product.status === "published" ? "bg-green-50 text-green-700 border border-green-200" : "bg-hairline/50 text-muted border border-hairline"}`}>
          <i className={`fa-solid ${product.status === "published" ? "fa-circle-check" : "fa-pen-to-square"}`} />
          Status: {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
          <span className="text-xs text-muted ml-auto">Created {new Date(product.created_at).toLocaleDateString("en-NG")}</span>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 flex items-center gap-3"><i className="fa-solid fa-circle-exclamation" />{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-600 flex items-center gap-3"><i className="fa-solid fa-circle-check" />Product updated successfully!</div>}

        <form onSubmit={handleSave} className="flex flex-col gap-8">
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-geist)] mb-5">Basic Information</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="productName" className="text-sm font-medium flex items-center gap-1">Product Name <span className="text-red-500">*</span></label>
                <input id="productName" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-11 px-4 rounded-lg border border-hairline bg-surface text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors" />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description <span className="text-muted font-normal">(Optional)</span></label>
                <textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe what&apos;s included..." className="w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y min-h-[100px] transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-geist)] mb-5">Pricing</h2>
            <div className="space-y-2 max-w-[200px]">
              <label htmlFor="price" className="text-sm font-medium flex items-center gap-1">Amount <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted text-sm pointer-events-none">₦</span>
                <input
                  id="price"
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatNairaInput(form.price_amount || "")}
                  onChange={(e) => setForm({ ...form, price_amount: Number(e.target.value.replace(/,/g, "")) })}
                  className="w-full h-11 pl-8 pr-4 rounded-lg border border-hairline bg-surface text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>
              {amountInWords(form.price_amount) && (
                <p className="text-sm text-ink/70">
                  {amountInWords(form.price_amount).replace(/^./, (letter) => letter.toUpperCase())}
                </p>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-geist)] mb-5">Digital Assets {files.length > 0 && `(${files.length})`}</h2>
            <FileUpload productId={product.id} existingFiles={files} />
          </div>

          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-geist)] mb-5">Visibility</h2>
            <div className="flex gap-3">
              {[
                { value: "draft", label: "Draft", icon: "fa-solid fa-pen-to-square", desc: "Only you can see this" },
                { value: "published", label: "Published", icon: "fa-solid fa-globe", desc: "Visible to buyers" },
                { value: "archived", label: "Archived", icon: "fa-solid fa-box-archive", desc: "Hidden from buyers" },
              ].map((option) => (
                <button key={option.value} type="button" onClick={() => setForm({ ...form, status: option.value })} className={`flex-1 p-4 rounded-xl border text-left transition-all ${form.status === option.value ? "border-ink bg-ink text-white" : "border-hairline hover:border-ink/20"}`}>
                  <i className={`${option.icon} text-sm mb-2 block ${form.status === option.value ? "text-white" : "text-muted"}`} />
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className={`text-xs mt-0.5 ${form.status === option.value ? "text-white/70" : "text-muted"}`}>{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <i className="fa-solid fa-trash-can mr-2 text-xs" />Delete Product
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-hairline rounded-xl text-sm font-medium hover:bg-hairline/50 transition-colors">Cancel</button>
              <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 disabled:opacity-50 transition-all flex items-center gap-2">
                {isSaving ? <><i className="fa-solid fa-spinner fa-spin text-xs" />Saving...</> : <><i className="fa-solid fa-check text-xs" />Save Changes</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
          <div className="relative bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-8 max-w-[400px] w-full animate-zoom-in">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5"><i className="fa-solid fa-triangle-exclamation text-red-500 text-xl" /></div>
            <h3 className="text-lg font-semibold text-center font-[family-name:var(--font-geist)] mb-2">Delete Product?</h3>
            <p className="text-sm text-muted text-center mb-6">This will archive <strong>{product.name}</strong> and hide it from buyers. Existing orders and download history will be preserved while retained files remain available.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 border border-hairline rounded-xl text-sm font-medium hover:bg-hairline/50 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">{isDeleting ? <><i className="fa-solid fa-spinner fa-spin text-xs" />Archiving...</> : "Archive"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
