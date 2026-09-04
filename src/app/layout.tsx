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

export const metadata: Metadata = {
  title: "Dropcue — Sell Your Digital Products Instantly",
  description:
    "The simplest way for creators to sell digital products and track secure delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://cdnjs.cloudflare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={`${geist.variable} ${inter.variable} antialiased`}>
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
