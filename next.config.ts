import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Temporary config for development with ngrok
  allowedDevOrigins: ["evoke-mower-purist.ngrok-free.dev", "192.168.0.3"],
};

export default nextConfig;
