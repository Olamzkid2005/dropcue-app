import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Header — exact from design */}
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-hairline">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center"
            >
              <img
                src="/logo.png"
                alt="Dropcue"
                className="h-12 w-auto"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/#product"
                className="nav-link relative text-sm font-medium text-ink"
              >
                Product
              </Link>
              <Link
                href="/how-it-works"
                className="nav-link relative text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="/pricing"
                className="nav-link relative text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/security"
                className="nav-link relative text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                Security
              </Link>
              <Link
                href="/#faq"
                className="nav-link relative text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                FAQ
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-surface rounded-lg shadow-soft border border-hairline">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span className="text-xs text-muted">Live</span>
            </div>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/auth/login"
              className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d25a3] transition-all"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </header>

      <main className="overflow-x-hidden">{children}</main>

      {/* Footer — exact from design */}
      <footer className="bg-paper border-t border-hairline py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4">
              <Link
                href="/"
                className="flex items-center"
              >
                <img
                  src="/logo.png"
                  alt="Dropcue"
                  className="h-12 w-auto"
                />
              </Link>
              <p className="text-sm text-muted leading-relaxed">
                The simplest way for creators to sell digital products and get
                paid instantly.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-muted">
                <li>
                  <Link href="/#product" className="hover:text-ink transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-ink transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-ink transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className="hover:text-ink transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-muted">
                <li>
                  <a href="#" className="hover:text-ink transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-ink transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-ink transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-ink transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-muted">
                <li>
                  <a href="#" className="hover:text-ink transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-ink transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-hairline flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-muted">
              &copy; 2026 Dropcue. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-muted hover:text-ink transition-colors"
              >
                <i className="fa-brands fa-x-twitter" />
              </a>
              <a
                href="#"
                className="text-muted hover:text-ink transition-colors"
              >
                <i className="fa-brands fa-instagram" />
              </a>
              <a
                href="#"
                className="text-muted hover:text-ink transition-colors"
              >
                <i className="fa-brands fa-tiktok" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
