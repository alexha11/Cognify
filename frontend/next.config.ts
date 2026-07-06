import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production, we expect NEXT_PUBLIC_API_URL to point to the backend's URL.
    // In local dev, it falls back to localhost:3001.
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    
    // We rewrite /api/* on the frontend to the backend URL.
    return [
      {
        // For frontend requests to /api/courses -> backendUrl/courses
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
