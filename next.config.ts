import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for smaller Railway deploys
  output: "standalone",

  images: {
    remotePatterns: [
      // Allow images served from any Railway subdomain (production)
      { protocol: "https", hostname: "*.up.railway.app" },
      // Allow localhost for local development
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
