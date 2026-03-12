import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  turbopack: { root: process.cwd() },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "miro.medium.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
