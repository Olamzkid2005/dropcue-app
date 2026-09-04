import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable Turbopack to use webpack */
  experimental: {
    // Use webpack by not enabling turbopack
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
