import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dropcue — Sell Your Digital Products Instantly",
    template: "%s | Dropcue",
  },
  description:
    "The simplest way for creators to sell digital products and track secure delivery.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Dropcue",
    title: "Dropcue — Sell Your Digital Products Instantly",
    description:
      "The simplest way for creators to sell digital products and track secure delivery.",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "Dropcue" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dropcue — Sell Your Digital Products Instantly",
    description:
      "The simplest way for creators to sell digital products and track secure delivery.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3a30c7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#141416" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="Dropcue for AI agents" />
        <link
          rel="preconnect"
          href="https://cdnjs.cloudflare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={`${geist.variable} ${inter.variable} antialiased`}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Dropcue",
              url: siteUrl,
              description: "Sell digital products and deliver them securely.",
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/p/{search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
