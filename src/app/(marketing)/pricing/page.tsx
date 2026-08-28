import Link from "next/link";
import { Fragment } from "react";

const features = [
  { name: "Unlimited products", starter: true, pro: true },
  { name: "Automatic delivery", starter: true, pro: true },
  { name: "Transaction fee", starter: "6.9% + $0.30", pro: "2.9% + $0.30" },
  { name: "Max file size", starter: "2GB", pro: "10GB" },
  { name: "Custom checkout branding", starter: false, pro: true },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-16 text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <span className="text-xs uppercase tracking-widest text-muted font-semibold">
            Pricing
          </span>
          <h1 className="text-5xl font-semibold tracking-tight leading-[1.1]">
            Free to start. Pay only when you sell.
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            No monthly bill, no setup cost, no surprise charges. Dropcue takes a
            small fee only on completed sales — so you never pay for a product
            that hasn&apos;t sold.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section id="plans" className="pb-24">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          {/* Starter */}
          <div className="bg-surface p-10 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline space-y-6">
            <div>
              <h3 className="text-xl font-semibold">Starter</h3>
              <p className="text-sm text-muted mt-1">
                For creators making their first sale
              </p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-tight">$0</span>
              <span className="text-muted text-sm mb-1">/ month</span>
            </div>
            <p className="text-sm text-muted">
              6.9% + $0.30 per transaction
            </p>
            <Link
              href="/auth/login"
              className="block text-center px-6 py-3 border border-hairline rounded-lg text-sm font-medium hover:bg-ink hover:text-white hover:border-ink transition-all"
            >
              Start for free
            </Link>
            <ul className="space-y-3 text-sm pt-4 border-t border-hairline">
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Unlimited products
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Automatic delivery &amp; hosting
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Instant payouts
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Files up to 2GB
              </li>
            </ul>
          </div>

          {/* Pro */}
          <div className="relative bg-surface p-10 rounded-[var(--radius-jumbo)] shadow-jumbo border-2 border-accent space-y-6">
            <span className="absolute -top-3 left-10 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
              Most popular
            </span>
            <div>
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="text-sm text-muted mt-1">
                For creators selling regularly
              </p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-tight">$12</span>
              <span className="text-muted text-sm mb-1">/ month</span>
            </div>
            <p className="text-sm text-muted">
              2.9% + $0.30 per transaction
            </p>
            <Link
              href="/auth/login"
              className="block text-center px-6 py-3 bg-accent text-white rounded-lg text-sm font-medium hover:bg-[#2d25a3] transition-all"
            >
              Start Pro trial
            </Link>
            <ul className="space-y-3 text-sm pt-4 border-t border-hairline">
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Everything in Starter
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Lower transaction fee
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Custom checkout branding
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                Files up to 10GB
              </li>
            </ul>
          </div>
        </div>
        <p className="text-center text-sm text-muted mt-8">
          Both plans include instant automatic delivery, secure file storage,
          and encrypted checkout.
        </p>
      </section>

      {/* Comparison Table */}
      <section className="py-20 border-t border-hairline">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-semibold tracking-tight mb-8 text-center">
            What&apos;s included
          </h2>
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline overflow-hidden">
            <div className="grid grid-cols-3 text-sm">
              <div className="p-5 font-medium text-muted">Feature</div>
              <div className="p-5 font-medium text-center border-l border-hairline">
                Starter
              </div>
              <div className="p-5 font-medium text-center border-l border-hairline bg-accent/5">
                Pro
              </div>

              {features.map((f, i) => (
                <Fragment key={i}>
                  <div className="p-5 border-t border-hairline">
                    {f.name}
                  </div>
                  <div className="p-5 text-center border-t border-l border-hairline">
                    {typeof f.starter === "boolean" ? (
                      <i
                        className={`fa-solid ${f.starter ? "fa-check text-accent" : "fa-minus text-hairline"}`}
                      />
                    ) : (
                      <span className="text-muted">{f.starter}</span>
                    )}
                  </div>
                  <div className="p-5 text-center border-t border-l border-hairline bg-accent/5">
                    {typeof f.pro === "boolean" ? (
                      <i
                        className={`fa-solid ${f.pro ? "fa-check text-accent" : "fa-minus text-hairline"}`}
                      />
                    ) : (
                      <span className="text-muted">{f.pro}</span>
                    )}
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-hairline">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl font-semibold tracking-tight">
            Start selling with zero risk
          </h2>
          <p className="text-muted text-lg">
            Create an account and publish your first product for free.
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
