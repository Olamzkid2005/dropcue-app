import Link from "next/link";
import Image from "next/image";
import { ProductDemo } from "@/components/landing/product-demo";
import { CheckoutDemo } from "@/components/landing/checkout-demo";
import { DashboardDemo } from "@/components/landing/dashboard-demo";
import { ComparisonSlider } from "@/components/landing/comparison-slider";

const howItWorksSteps = [
  {
    num: "1",
    title: "Upload your file",
    desc: "Drag and drop audio, video, or documents. We handle hosting and delivery.",
    icon: "fa-solid fa-cloud-arrow-up",
  },
  {
    num: "2",
    title: "Set your price",
    desc: "Choose a fixed price or let buyers pay what they want. You control everything.",
    icon: "fa-solid fa-tag",
  },
  {
    num: "3",
    title: "Share one link",
    desc: "Paste your link anywhere—socials, emails, or bio. Buyers check out in seconds.",
    icon: "fa-solid fa-link",
  },  {
    num: "4",
    title: "Track the sale",
    desc: "Payment status and order details stay visible in your dashboard.",
    icon: "fa-solid fa-receipt",
  },
];

const features = [
  {
    icon: "fa-solid fa-cloud-arrow-up",
    title: "Upload & Sell",
    desc: "Upload digital files — music, templates, eBooks, code — and set your price in seconds.",
  },
  {
    icon: "fa-solid fa-share",
    title: "Share a Link",
    desc: "Get a clean, branded product page. Share it anywhere — social media, email, your website.",
  },
  {
    icon: "fa-solid fa-lock",
    title: "Secure Delivery",
    desc: "Buyers get a unique, expiring download link. Your files stay protected with one-time tokens.",
  },
  {
    icon: "fa-solid fa-credit-card",
    title:      "Track Sales",
    desc: "Accept payments through the configured provider and track orders from a single dashboard.",
  },
];

export default function MarketingHomePage() {
  return (
    <>
      {/* Hero Section */}
      <section id="product" className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <span className="text-xs uppercase tracking-widest text-muted font-semibold">
              Built for digital creators
            </span>
            <h1 className="text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
              Upload. Price it. Share the link. Get paid.
            </h1>
            <p className="text-lg text-muted max-w-md leading-relaxed">
              Dropcue delivers instant automatic delivery for your audio,
              presets, and PDFs. No store setup, no monthly fees—just a link and
              a sale.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-transparent border border-hairline rounded-lg text-base font-medium hover:bg-ink hover:text-white hover:border-ink transition-all duration-300"
              >
                Start selling for free
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-medium text-muted hover:text-ink transition-colors"
              >
                See how it works{" "}
                <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
            </div>
            <div className="pt-4 flex items-center gap-6 text-sm text-muted">
              <span>
                <i className="fa-solid fa-check mr-2 text-ink" />
                Zero starting fees
              </span>
              <span>
                <i className="fa-solid fa-check mr-2 text-ink" />
                Track completed sales
              </span>
            </div>
          </div>

          {/* Live Product Demo */}
          <div className="relative">
            <ProductDemo />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-paper">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-4xl font-semibold tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-muted text-lg max-w-xl">
              Four steps from upload to order tracking. Everything else is handled
              automatically.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((step) => (
              <div
                key={step.num}
                className="bg-surface p-8 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline"
              >
                <div className="w-12 h-12 bg-ink text-white rounded-xl flex items-center justify-center mb-6">
                  <i className={`${step.icon} text-lg`} />
                </div>
                <h3 className="text-xl font-medium mb-3">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Gallery (Creators) */}
      <section className="py-24 bg-paper">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-4xl font-semibold tracking-tight mb-4">
              Built for every kind of creator
            </h2>
            <p className="text-muted text-lg">
              From beats to blueprints—sell whatever you make.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <a href="#" className="group space-y-4">
              <div className="aspect-square bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline overflow-hidden">
                <Image
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  src="/marketing/creator-music.jpg"
                  alt="music producer working at a laptop in a dim studio, headphones around neck, moody cinematic lighting"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-music mt-1 text-accent" />
                <div>
                  <h3 className="font-medium">Music producers</h3>
                  <p className="text-sm text-muted">
                    Sell beats and samples directly to artists.
                  </p>
                </div>
              </div>
            </a>
            <a href="#" className="group space-y-4">
              <div className="aspect-square bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline overflow-hidden">
                <Image
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  src="/marketing/creator-photo.jpg"
                  alt="photographer reviewing portfolio on a tablet in a bright minimalist workspace, natural light"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-camera mt-1 text-accent" />
                <div>
                  <h3 className="font-medium">Photographers</h3>
                  <p className="text-sm text-muted">
                    License presets and high-res packs instantly.
                  </p>
                </div>
              </div>
            </a>
            <a href="#" className="group space-y-4">
              <div className="aspect-square bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline overflow-hidden">
                <Image
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  src="/marketing/creator-design.jpg"
                  alt="graphic designer sketching on a tablet at a clean desk, modern interior, soft daylight"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-pen-nib mt-1 text-accent" />
                <div>
                  <h3 className="font-medium">Designers</h3>
                  <p className="text-sm text-muted">
                    Monetize templates, brushes, and mockups.
                  </p>
                </div>
              </div>
            </a>
            <a href="#" className="group space-y-4">
              <div className="aspect-square bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline overflow-hidden">
                <Image
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  src="/marketing/creator-video.jpg"
                  alt="video editor at a dual-monitor editing suite, focused expression, dark cinematic room"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-film mt-1 text-accent" />
                <div>
                  <h3 className="font-medium">Video editors</h3>
                  <p className="text-sm text-muted">
                    Distribute LUTs, transitions, and reels packs.
                  </p>
                </div>
              </div>
            </a>
            <a href="#" className="group space-y-4">
              <div className="aspect-square bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline overflow-hidden">
                <Image
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  src="/marketing/creator-course.jpg"
                  alt="online course creator recording a lesson on a phone tripod in a cozy home office, warm tones"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-graduation-cap mt-1 text-accent" />
                <div>
                  <h3 className="font-medium">Course creators</h3>
                  <p className="text-sm text-muted">
                    Deliver full courses and worksheets automatically.
                  </p>
                </div>
              </div>
            </a>
            <a href="#" className="group space-y-4">
              <div className="aspect-square bg-surface rounded-[var(--radius-jumbo)] shadow-soft border border-hairline overflow-hidden">
                <Image
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  src="/marketing/creator-writer.jpg"
                  alt="writer typing on a laptop beside a notebook and coffee in a sunlit room, calm atmosphere"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-book mt-1 text-accent" />
                <div>
                  <h3 className="font-medium">Writers</h3>
                  <p className="text-sm text-muted">
                    Sell guides, scripts, and downloadable books.
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Product Showcase (split layout) */}
      <section className="py-24 bg-paper border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-accent/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline overflow-hidden">
              <Image
                className="w-full"
                src="/marketing/showcase-ui.jpg"
                alt="clean minimal web app dashboard UI mockup of a digital storefront showing product listings, sales stats"
                width={1024}
                height={1024}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 aspect-video bg-surface rounded-2xl shadow-jumbo border border-hairline p-3 hidden lg:block">
              <Image
                className="w-full h-full object-cover rounded-xl"
                src="/marketing/showcase-device.jpg"
                alt="sleek compact digital drive device product render without background, soft studio lighting"
                width={1024}
                height={1024}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className="space-y-8">            <h2 className="text-4xl font-semibold tracking-tight">
              A storefront that delivers while you sleep
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              Dropcue gives you a beautiful, mobile-ready checkout page in
              seconds. Buyers pay, you get notified, and the files become
              available through a secure download link.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                <span>Automatic file delivery after purchase</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                <span>Order tracking from one dashboard</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-accent" />
                <span>Clean, mobile-ready checkout pages</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Interactive Comparison Slider */}
      <section className="py-24 bg-paper">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">
              One link. Two experiences.
            </h2>
            <p className="text-muted mt-3">
              Drag to compare the creator view and the buyer view.
            </p>
          </div>
          <ComparisonSlider />
        </div>
      </section>

      {/* Feature Showcase — Live Dashboard + Checkout */}
      <section className="py-24 bg-paper border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-4xl font-semibold tracking-tight mb-4">
              Everything you need to sell
            </h2>
            <p className="text-muted text-lg max-w-xl">
              A complete toolkit — from upload to secure delivery, all in one place.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Live Dashboard Preview */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-4">
                Creator Dashboard
              </p>
              <DashboardDemo />
            </div>
            {/* Live Checkout Preview */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-4">
                Buyer Checkout
              </p>
              <CheckoutDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-paper border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-surface p-8 rounded-[var(--radius-jumbo)] shadow-soft border border-hairline"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-5">
                  <i className={`${f.icon} text-accent text-lg`} />
                </div>
                <h3 className="text-xl font-medium mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section
        id="security"
        className="py-24 bg-paper border-t border-hairline"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-semibold tracking-tight">
                Secure, private, and built to last
              </h2>
              <p className="text-muted text-lg leading-relaxed">
                Your files are stored securely and delivered through an encrypted
                checkout. Buyers never see your source files, and you never
                handle payments manually.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-shield-halved text-accent text-xl" />
                  <span className="text-sm font-medium">Secure storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-lock text-accent text-xl" />
                  <span className="text-sm font-medium">
                    Encrypted checkout
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-eye-slash text-accent text-xl" />
                  <span className="text-sm font-medium">
                    Private by default
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-clock text-accent text-xl" />
                  <span className="text-sm font-medium">Always online</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-12 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-shield-heart text-accent text-3xl" />
                </div>
                <h3 className="text-2xl font-semibold">
                  Protected for creators and buyers alike
                </h3>
                <p className="text-muted">
                  Payments are verified by the configured provider before files
                  are released.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
                  </span>
                  <span className="text-xs text-muted uppercase tracking-widest font-semibold">
                    Payment flow protected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Activity Ticker */}
          <div className="mt-24 border-t border-hairline pt-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-xs uppercase tracking-widest font-semibold text-muted">
                How delivery works
              </span>
            </div>              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted">
                <span>Payment verified before delivery</span>
                <span>Private storage by default</span>
                <span>Expiring download links</span>
              </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-paper border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              No monthly fees. No hidden charges. You keep the majority of what
              you earn.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="bg-surface p-10 rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline text-center space-y-6">
              <h3 className="text-2xl font-semibold">
                Free to start, small fee per sale
              </h3>
              <div className="py-4">
                <span className="text-5xl font-semibold tracking-tight">
                  $0
                </span>
                <span className="text-muted text-sm ml-2">to get started</span>
              </div>
              <p className="text-muted">
                Only a small percentage when someone buys. No subscriptions,
                ever.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center w-full px-8 py-3.5 bg-transparent border border-hairline rounded-lg text-base font-medium hover:bg-ink hover:text-white hover:border-ink transition-all duration-300"
              >
                Start selling for free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-paper border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <i className="fa-solid fa-quote-left text-accent text-4xl" />
              <blockquote className="text-2xl font-medium leading-relaxed tracking-tight">
                &ldquo;I uploaded a pack of presets on a Tuesday and had my first
                sale by Thursday morning. Dropcue handled the rest.&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <i className="fa-solid fa-user text-accent" />
                </div>
                <div>
                  <div className="font-medium">Alex Rivera</div>
                  <div className="text-sm text-muted">
                    Independent Music Producer
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline p-12">
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fa-solid fa-star text-accent" />
                  ))}
                </div>
                <p className="text-muted mb-8">
                Keep product and order details in one place as you sell.
                </p>
                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full border-2 border-surface bg-gray-100 flex items-center justify-center text-xs font-medium text-muted"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-2 border-surface bg-gray-100 flex items-center justify-center text-xs font-medium">
                    +2k
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="start"
        className="py-32 bg-paper border-t border-hairline"
      >
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-5xl font-semibold tracking-tight">
            Your first sale can happen today
          </h2>
          <p className="text-muted text-lg">
            Create your account, upload a file, and share your link. It takes
            less than five minutes.
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
