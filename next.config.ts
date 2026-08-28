import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable Turbopack to use webpack */
  experimental: {
    // Use webpack by not enabling turbopack
  },
};

export default nextConfig;
