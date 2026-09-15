"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">500</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">Something went wrong</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          We could not complete that request. Try again or return to a safe page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">Try again</button>
          <Link href="/" className="btn-secondary">Go to homepage</Link>
        </div>
      </div>
    </main>
  );
}
