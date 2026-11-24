import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  typescript: process.env.HEALTHCLUES_ISOLATED_RUNTIME === "1"
    ? { ignoreBuildErrors: true }
    : undefined,
  experimental: {
    cpus: 2,
  },
  turbopack: {
    // Keep builds started from isolated App/.tmp test copies inside that copy.
    // Next otherwise discovers the workspace lockfile above it and shares the
    // root .next route types/manifest with unrelated baseline builds.
    root: path.resolve(process.env.HEALTHCLUES_TURBOPACK_ROOT || process.cwd()),
  },
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
