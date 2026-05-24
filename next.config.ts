import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // MiroFish 原生前端 (Docker 默认映射 3000→3003)
      {
        source: "/mirofish",
        destination: "http://localhost:3003/",
      },
      {
        source: "/mirofish/:path*",
        destination: "http://localhost:3003/:path*",
      },
      // MiroFish 后端 API (Docker 默认映射 5001→5001)
      {
        source: "/simulation/:path*",
        destination: "http://localhost:5001/simulation/:path*",
      },
    ];
  },
};

export default nextConfig;
