import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (default in Next 16) — no extra config needed for Solana packages
  turbopack: {},

  // Keep webpack config for `next build --webpack` fallback
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
