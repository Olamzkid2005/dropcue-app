import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-16 border-b border-hairline">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs uppercase tracking-widest text-muted font-semibold">
            How it works
          </span>
          <h1 className="text-5xl font-semibold tracking-tight leading-[1.1]">
            From file to first sale in minutes
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Dropcue removes every unnecessary step between &quot;I made
            something&quot; and &quot;I got paid for it.&rdquo; Here&apos;s
            exactly what happens.
          </p>
        </div>
      </section>

      {/* Step 1 — Upload */}
      <section id="step-1" className="py-24 border-b border-hairline">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span className="text-xs uppercase tracking-widest text-muted font-semibold">
                Upload
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Drop in your file, we handle the rest
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              Upload audio, zip archives, PDFs, or video directly from your
              browser. Dropcue stores it securely and generates a private,
              tamper-proof delivery copy — no separate hosting or file links to
              manage.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Supports audio, video, ZIP, PDF and image files
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Files up to 2GB on the free plan
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Automatic virus and integrity scanning
              </li>
            </ul>
          </div>
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-8">
            <div className="border-2 border-dashed border-hairline rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <i className="fa-solid fa-cloud-arrow-up text-accent text-xl" />
              </div>
              <p className="font-medium">Drag and drop your file here</p>
              <p className="text-sm text-muted">
                or click to browse — MP3, WAV, ZIP, PDF up to 2GB
              </p>
            </div>
            <div className="mt-4 bg-gray-50 rounded-xl p-4 flex items-center gap-3">
              <i className="fa-solid fa-file-audio text-accent" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  midnight-drive-master.wav
                </p>
                <div className="h-1.5 bg-hairline rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-4/5 bg-accent rounded-full" />
                </div>
              </div>
              <span className="text-xs text-muted">82%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2 — Price */}
      <section
        id="step-2"
        className="py-24 border-b border-hairline bg-surface/40"
      >
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-8 space-y-5">
            <div>
              <label className="text-sm font-medium">Price</label>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-12 bg-gray-50 rounded-xl border border-hairline flex items-center px-4">
                  <span className="text-muted mr-1">$</span>
                  <span className="font-semibold">29.00</span>
                </div>
                <span className="text-xs text-muted">USD</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-hairline">
              <div>
                <p className="text-sm font-medium">Pay-what-you-want</p>
                <p className="text-xs text-muted">
                  Let buyers choose an amount above your minimum
                </p>
              </div>
              <div className="w-11 h-6 bg-hairline rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full shadow absolute top-0.5 left-0.5" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-hairline">
              <div>
                <p className="text-sm font-medium">Limited licenses</p>
                <p className="text-xs text-muted">
                  Cap how many times this can be sold
                </p>
              </div>
              <div className="w-11 h-6 bg-accent rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full shadow absolute top-0.5 right-0.5" />
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span className="text-xs uppercase tracking-widest text-muted font-semibold">
                Price
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">
              You decide what it&apos;s worth
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              Set a fixed price, allow pay-what-you-want, or cap the number of
              licenses available. No tiers, no bundles to configure — just the
              price that makes sense for this file.
            </p>
          </div>
        </div>
      </section>

      {/* Step 3 — Share */}
      <section id="step-3" className="py-24 border-b border-hairline">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span className="text-xs uppercase tracking-widest text-muted font-semibold">
                Share
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">
              One link. Anywhere you post.
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              Every product gets a clean, brandable link the moment it&apos;s
              created. Drop it in your Instagram bio, a DM, a tweet, or your
              email signature — it always leads to the same fast checkout.
            </p>
          </div>
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-8 space-y-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl border border-hairline px-4 py-3.5">
              <i className="fa-solid fa-link text-muted" />
              <span className="flex-1 text-sm truncate">
                dropcue.co/beats/midnight-drive
              </span>
              <button className="px-3 py-1.5 bg-ink text-white rounded-lg text-xs font-medium">
                Copy
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="aspect-square bg-gray-50 rounded-xl border border-hairline flex items-center justify-center">
                <i className="fa-brands fa-instagram" />
              </div>
              <div className="aspect-square bg-gray-50 rounded-xl border border-hairline flex items-center justify-center">
                <i className="fa-brands fa-x-twitter" />
              </div>
              <div className="aspect-square bg-gray-50 rounded-xl border border-hairline flex items-center justify-center">
                <i className="fa-brands fa-tiktok" />
              </div>
              <div className="aspect-square bg-gray-50 rounded-xl border border-hairline flex items-center justify-center">
                <i className="fa-solid fa-envelope" />
              </div>
            </div>
            <div className="p-4 bg-accent/5 rounded-xl border border-accent/20 flex items-center gap-3">
              <i className="fa-solid fa-qrcode text-accent" />
              <p className="text-sm text-muted">
                QR code generated automatically for print or stories
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4 — Get Paid */}
      <section id="step-4" className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-8 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <i className="fa-solid fa-dollar-sign text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Payment received</p>
                  <p className="text-xs text-muted">
                    Midnight Drive Type Beat — $29.00
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted">Just now</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <i className="fa-solid fa-paper-plane text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">File delivered</p>
                  <p className="text-xs text-muted">
                    Secure download link emailed to buyer
                  </p>
                </div>
              </div>
              <i className="fa-solid fa-circle-check text-accent" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <i className="fa-solid fa-building-columns text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Payout on the way</p>
                  <p className="text-xs text-muted">
                    Deposits to your bank instantly
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span className="text-xs uppercase tracking-widest text-muted font-semibold">
                Get paid
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Delivery and payout, automatically
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              The moment a buyer pays, Dropcue verifies the transaction, sends
              the file to their inbox with a secure download link, and starts
              your payout. You never touch a support ticket or a manual transfer.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-hairline">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl font-semibold tracking-tight">
            See it work with your own file
          </h2>
          <p className="text-muted text-lg">
            Create your first product and get a shareable link in under five
            minutes.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-10 py-4 bg-accent text-white rounded-lg text-lg font-medium hover:bg-[#2d25a3] transition-all"
          >
            Start selling for free
          </Link>
        </div>
      </section>
    </>
  );
}
