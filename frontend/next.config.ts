import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production on Vercel, INTERNAL_API_URL is automatically set to
    // the internal backend service URL.
    // In local dev, fall back to localhost:3001.
    const apiBase = process.env.INTERNAL_API_URL || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
