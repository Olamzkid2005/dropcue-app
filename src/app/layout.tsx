import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { Nav } from "@/components/nav";
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
  title: "Dropcue — Digital Product Delivery",
  description: "Sell and deliver digital products securely",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${geist.variable} ${inter.variable} antialiased`}>
        <Nav />
        <main className="pt-16">{children}</main>
        <FeedbackButton pageUrl="/" />
        <footer className="bg-surface-canvas border-t border-outline-variant w-full py-8 px-6 mt-auto">
          <div className="max-w-[1120px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[12px] text-secondary">
              &copy; 2024 Dropcue. Premium Digital Delivery.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-[12px] text-secondary hover:text-accent-indigo transition-colors">Terms</a>
              <a href="#" className="text-[12px] text-secondary hover:text-accent-indigo transition-colors">Privacy</a>
              <a href="#" className="text-[12px] text-secondary hover:text-accent-indigo transition-colors">Help Center</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
