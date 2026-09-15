"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main id="main-content" style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ maxWidth: "36rem", textAlign: "center" }}>
            <p style={{ fontWeight: 700, letterSpacing: "0.15em" }}>500</p>
            <h1 style={{ fontSize: "2.25rem", marginTop: "1rem" }}>Something went wrong</h1>
            <p style={{ lineHeight: 1.6, marginTop: "1rem" }}>Please try again. We are working to restore the page.</p>
            <button type="button" onClick={reset} style={{ cursor: "pointer", marginTop: "2rem", padding: "0.75rem 1rem" }}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
