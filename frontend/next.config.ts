import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production, we expect NEXT_PUBLIC_API_URL to point to the backend's root URL (e.g., https://backend.onrender.com).
    // In local dev, it falls back to http://localhost:3001.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "")?.replace(/\/$/, "") || "http://localhost:3001";
    
    // We rewrite /api/* on the frontend to the backend URL + /api/*
    return [
      {
        source: "/api/:path*",
        destination: `${baseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
