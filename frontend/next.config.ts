import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // gRPC backend proxy - forward API calls to backend
  async rewrites() {
    return [
      {
        source: "/api/grpc/:path*",
        destination: "http://localhost:50051/:path*",
      },
    ];
  },
};

export default nextConfig;
