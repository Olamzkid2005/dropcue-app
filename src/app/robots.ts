import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/", "/pricing", "/how-it-works", "/security", "/privacy", "/terms"],
        disallow: ["/dashboard", "/auth", "/setup", "/api/", "/download/", "/payment/"],
      },
      {
        userAgent: ["GPTBot", "Google-Extended", "CCBot", "anthropic-ai"],
        allow: ["/", "/p/", "/pricing", "/how-it-works", "/security", "/privacy", "/terms"],
        disallow: ["/dashboard", "/auth", "/setup", "/api/", "/download/", "/payment/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
