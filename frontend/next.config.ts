import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // IonQ jobs may take up to 120 seconds; keep the proxy within the UI's 150s limit.
  experimental: { proxyTimeout: 150000 },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL || "http://127.0.0.1:8000"}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;
