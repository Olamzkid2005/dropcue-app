import Link from "next/link";

const pillars = [
  {
    icon: "fa-solid fa-shield-halved",
    title: "Encrypted storage",
    desc: "Files are encrypted at rest and in transit, stored on redundant cloud infrastructure with automatic backups.",
  },
  {
    icon: "fa-solid fa-credit-card",
    title: "PCI-compliant checkout",
    desc: "Card details are handled by a certified payment processor. Dropcue never sees or stores raw card numbers.",
  },
  {
    icon: "fa-solid fa-link-slash",
    title: "Tamper-proof download links",
    desc: "Delivery links are single-use and expiring, generated only after a payment is verified — never before.",
  },
  {
    icon: "fa-solid fa-user-shield",
    title: "Fraud monitoring",
    desc: "Every transaction is screened in real time to catch stolen cards and chargebacks before they reach you.",
  },
];

const steps = [
  {
    num: "1",
    label: "Buyer pays",
    desc: "funds are authorized and verified before anything is released.",
  },
  {
    num: "2",
    label: "Dropcue confirms",
    desc: "payment is settled and a one-time delivery token is created.",
  },
  {
    num: "3",
    label: "File is released",
    desc: "the buyer receives a secure, expiring link by email and on-screen.",
  },
];

const buyerTrust = [
  {
    icon: "fa-solid fa-receipt",
    title: "Instant email receipt",
    desc: "Every purchase is confirmed automatically.",
  },
  {
    icon: "fa-solid fa-rotate-left",
    title: "Clear refund policy",
    desc: "Set your own terms, shown at checkout.",
  },
  {
    icon: "fa-solid fa-headset",
    title: "Dispute support",
    desc: "We help mediate any payment issue.",
  },
];

export default function SecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-16 text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <span className="text-xs uppercase tracking-widest text-muted font-semibold">
            Security
          </span>
          <h1 className="text-5xl font-semibold tracking-tight leading-[1.1]">
            Built to protect your work and your income
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Every file, payment, and download on Dropcue passes through the same
            security standards used by major payment processors — without you
            having to configure anything.
          </p>
        </div>
      </section>

      {/* 4 Pillars */}
      <section id="pillars" className="pb-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="bg-surface p-8 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                <i className={`${p.icon} text-accent text-lg`} />
              </div>
              <h3 className="text-lg font-medium mb-2">{p.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Section */}
      <section className="py-24 border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-semibold tracking-tight">
              Your files stay yours until the sale clears
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              Buyers never access your original file directly. Dropcue only
              issues a secure, watermarked or single-use delivery copy after a
              payment has fully processed — protecting you from chargebacks and
              leaked files.
            </p>
            <div className="space-y-5">
              {steps.map((s) => (
                <div key={s.num} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.num}
                  </div>
                  <p className="text-sm text-muted">
                    <span className="text-ink font-medium">{s.label}</span> —{" "}
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-10 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-lock text-accent text-3xl" />
            </div>
            <h3 className="text-2xl font-semibold">
              256-bit encryption, end to end
            </h3>
            <p className="text-muted">
              From upload to download, your data is protected by the same
              encryption standard used by banks.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
              </span>
              <span className="text-xs text-muted uppercase tracking-widest font-semibold">
                All systems secure
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer Trust */}
      <section className="py-24 border-t border-hairline">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            Trust that works both ways
          </h2>
          <p className="text-muted text-lg mb-12">
            Buyers feel safe purchasing from a Dropcue link, which means more
            completed checkouts for you.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {buyerTrust.map((b) => (
              <div
                key={b.title}
                className="p-6 bg-surface rounded-2xl border border-hairline"
              >
                <i className={`${b.icon} text-accent mb-3`} />
                <p className="text-sm font-medium mb-1">{b.title}</p>
                <p className="text-xs text-muted">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-hairline">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl font-semibold tracking-tight">
            Sell with confidence
          </h2>
          <p className="text-muted text-lg">
            Your work and your income are protected from the first upload.
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
