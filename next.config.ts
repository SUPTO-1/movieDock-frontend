import type { NextConfig } from "next";

const backendUrl = new URL(process.env.BACKEND_URL ?? "http://127.0.0.1:5000");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Keep the specific jellyfin rule first so it matches before the
      // generic catch-all below (Next.js evaluates rewrites top-down).
      {
        source: "/api/jellyfin/:path*",
        destination: `${backendUrl.origin}/api/jellyfin/:path*`,
      },
      // Generic /api proxy so frontend code can call same-origin paths
      // like /api/health without tripping CORS in the browser.
      {
        source: "/api/:path*",
        destination: `${backendUrl.origin}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: backendUrl.hostname,
        port: backendUrl.port,
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: backendUrl.port,
      },
    ],
  },
};

export default nextConfig;
