import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "localhost:3001", "real-estate-crm-production-7320.up.railway.app"] },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
