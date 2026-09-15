import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">Page not found</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          The page may have moved or the link may be incorrect. Choose a destination below.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">Go to homepage</Link>
          <Link href="/how-it-works" className="btn-secondary">See how it works</Link>
        </div>
      </div>
    </main>
  );
}
