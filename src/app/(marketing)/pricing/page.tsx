import Link from "next/link";

const features = [
  "Unlimited products",
  "Automatic delivery after verified payment",
  "Private storage with expiring download links",
  "Order tracking for completed sales",
  "Files up to 500MB each",
];

export default function PricingPage() {
  return (
    <>
      <section className="pt-20 pb-16 text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <span className="text-xs uppercase tracking-widest text-muted font-semibold">
            Pricing
          </span>
          <h1 className="text-5xl font-semibold tracking-tight leading-[1.1]">
            Free to start. Pay when you sell.
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Create products and share their checkout links without a monthly
            subscription. Payment-provider fees apply when a buyer completes a
            purchase.
          </p>
        </div>
      </section>

      <section id="plans" className="pb-24">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-surface p-10 rounded-[var(--radius-jumbo)] shadow-jumbo border border-accent space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Dropcue</h2>
              <p className="text-sm text-muted mt-1">
                Everything needed to sell digital products in V1
              </p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-tight">₦0</span>
              <span className="text-muted text-sm mb-1">to get started</span>
            </div>
            <p className="text-sm text-muted">
              Payment-provider fees apply per completed transaction.
            </p>
            <Link
              href="/auth/login"
              className="block text-center px-6 py-3 bg-accent text-white rounded-lg text-sm font-medium hover:bg-[#2d25a3] transition-all"
            >
              Start selling for free
            </Link>
            <ul className="space-y-3 text-sm pt-4 border-t border-hairline">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <i className="fa-solid fa-circle-check text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-hairline">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl font-semibold tracking-tight">
            Start selling with zero monthly cost
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
