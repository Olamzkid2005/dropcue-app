"use client";

import Link from "next/link";
import { useState } from "react";
import { updateProduct } from "@/modules/products/server/actions";
import type { Product } from "@/modules/products/types";

function formatPrice(amountInKobo: number): string {
  const naira = amountInKobo / 100;
  return `₦${naira.toLocaleString("en-NG")}`;
}

function statusBadge(status: Product["status"]) {
  const styles: Record<Product["status"], string> = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${product.public_id}`;

  function copyShareLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleArchive() {
    if (!confirm("Archive this product? New purchases will be stopped.")) return;
    await updateProduct(product.id, { status: "archived" });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href={`/products/${product.id}`}
            className="text-sm font-semibold text-foreground hover:underline"
          >
            {product.name}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            {statusBadge(product.status)}
            <span className="text-sm font-medium text-foreground">
              {formatPrice(product.price_amount)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={copyShareLink}
          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        {product.status === "published" && (
          <button
            onClick={handleArchive}
            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
