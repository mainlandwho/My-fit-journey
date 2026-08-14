import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ws: false,
      bufferutil: false,
      "utf-8-validate": false,
    };
    return config;
  },
};

export default nextConfig;
