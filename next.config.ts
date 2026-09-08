import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/vi/admin/thong-ke", destination: "/admin/thong-ke" },
      { source: "/en/admin/thong-ke", destination: "/admin/thong-ke" },
      { source: "/admin", destination: "/admin/thong-ke" },
      { source: "/thong-ke", destination: "/admin/thong-ke" },
    ];
  },
};

export default nextConfig;
