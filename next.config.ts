import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/vi/admin/thong-ke", destination: "/admin/thong-ke" },
      { source: "/en/admin/thong-ke", destination: "/admin/thong-ke" },
      { source: "/admin", destination: "/admin/thong-ke" },
      { source: "/thong-ke", destination: "/admin/thong-ke" },
      { source: "/privacy", destination: "/chinh-sach-quyen-rieng-tu" },
      { source: "/privacy-policy", destination: "/chinh-sach-quyen-rieng-tu" },
      { source: "/chinh-sach-bao-mat", destination: "/chinh-sach-quyen-rieng-tu" },
    ];
  },
};

export default nextConfig;
