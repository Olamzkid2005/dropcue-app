"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/modules/products/server/actions";

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [createdProduct, setCreatedProduct] = useState<{ id: string; name: string; public_id: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_amount: 0,
  });
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await createProduct({
      name: form.name,
      description: form.description || undefined,
      price_amount: form.price_amount,
    });

    if (result.success && result.product) {
      setCreatedProduct({ id: result.product.id, name: result.product.name, public_id: result.product.public_id });
      setSuccess(true);
    } else {
      setError(result.error ?? "Failed to create product");
    }

    setIsSubmitting(false);
  }

  if (success && createdProduct) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
          <div className="flex items-center h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
            <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">New Product</h1>
          </div>
        </header>
        <div className="flex-1 p-6 lg:p-10 max-w-[640px] mx-auto w-full flex flex-col gap-8">
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-10 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-circle-check text-green-500 text-3xl" />
            </div>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-geist)] mb-2">Product Published!</h2>
            <p className="text-muted mb-8">
              Your digital product is live and ready to sell.
            </p>

            {/* Product Card */}
            <div className="bg-paper border border-hairline rounded-xl p-5 mb-6 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-music text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{createdProduct.name}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Active
                    </p>
                  </div>
                </div>
                <span className="text-lg font-semibold">₦{form.price_amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Share Link */}
            <div className="mb-6 text-left">
              <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Share Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/p/${createdProduct.public_id}`}
                  className="flex-1 bg-paper border border-hairline rounded-lg px-4 py-2.5 text-sm text-muted font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/p/${createdProduct.public_id}`
                    );
                  }}
                  className="bg-ink text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-copy text-xs" />
                  Copy
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-ink text-white py-3 rounded-xl text-sm font-medium hover:bg-ink/90 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setCreatedProduct(null);
                  setForm({ name: "", description: "", price_amount: 0 });
                  setSelectedFile(null);
                }}
                className="w-full bg-surface border border-hairline text-ink py-3 rounded-xl text-sm font-medium hover:bg-hairline/50 transition-colors"
              >
                Create Another Product
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl border-b border-hairline">
        <div className="flex items-center h-16 px-6 lg:px-10 max-w-[1200px] mx-auto">
          <h1 className="text-lg font-semibold font-[family-name:var(--font-geist)]">New Product</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 lg:p-10 max-w-[640px] mx-auto w-full flex flex-col gap-8">
        <div>
          <p className="text-muted">
            Set up the details for your new digital offering.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation" />
              {error}
            </div>
          )}

          {/* Basic Details */}
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-geist)] mb-5">Basic Information</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="productName" className="text-sm font-medium flex items-center gap-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="productName"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Summer Nights Beat"
                  className="w-full h-11 px-4 rounded-lg border border-hairline bg-surface text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-muted font-normal">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Briefly describe what's included..."
                  className="w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y min-h-[100px] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-geist)] mb-5">Pricing</h2>
            <div className="space-y-2 max-w-[200px]">
              <label htmlFor="price" className="text-sm font-medium flex items-center gap-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-muted text-sm">₦</span>
                </div>
                <input
                  id="price"
                  type="number"
                  required
                  min={100}
                  max={10000000}
                  step={100}
                  value={form.price_amount || ""}
                  onChange={(e) => setForm({ ...form, price_amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full h-11 pl-8 pr-4 rounded-lg border border-hairline bg-surface text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>
              <p className="text-xs text-muted">Minimum ₦100. You receive payment minus provider fees.</p>
            </div>
          </div>

          {/* Digital Asset */}
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline p-6">
            <h2 className="text-base font-semibold font-[family-name:var(--font-geist)] mb-5">Digital Asset</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                File Upload <span className="text-red-500">*</span>
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("fileUpload")?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? "border-accent bg-accent/5"
                    : selectedFile
                      ? "border-green-300 bg-green-50/50"
                      : "border-hairline hover:border-accent/50 hover:bg-paper"
                }`}
              >
                <div className="w-14 h-14 bg-surface rounded-full shadow-soft border border-hairline flex items-center justify-center">
                  <i
                    className={`text-xl ${
                      selectedFile
                        ? "fa-solid fa-circle-check text-green-500"
                        : "fa-solid fa-cloud-arrow-up text-muted"
                    }`}
                  />
                </div>
                <div className="text-center">
                  {selectedFile ? (
                    <>
                      <p className="text-sm font-medium text-ink">{selectedFile.name}</p>
                      <p className="text-xs text-muted mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB · Click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Drag & drop your file here, or click to browse</p>
                      <p className="text-xs text-muted mt-1">Supports ZIP, PDF, MP3 (Max 1GB)</p>
                    </>
                  )}
                </div>
                <input
                  id="fileUpload"
                  type="file"
                  className="hidden"
                  accept=".zip,.pdf,.mp3,.wav,.flac,.m4a,.mp4,.mov,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-hairline rounded-xl text-sm font-medium hover:bg-hairline/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs" />
                  Publishing...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane text-xs" />
                  Publish Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
