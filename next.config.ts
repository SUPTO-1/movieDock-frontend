import type { NextConfig } from "next";

const backendUrl = new URL(process.env.BACKEND_URL ?? "http://127.0.0.1:5000");

// Next.js caps proxied (rewrite) request bodies at 10 MB by default — fine
// for JSON APIs, but upload routes need to stream multi-GB movie files
// through the same rewrite. The largest per-type ceiling in the backend
// is 50 GB (movies/series/anime), so we leave 20 GB of headroom.
const MAX_PROXY_BODY_SIZE = "60gb";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["moviedock.local"],
  experimental: {
    proxyClientMaxBodySize: MAX_PROXY_BODY_SIZE,
  },
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
