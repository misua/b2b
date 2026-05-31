import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
