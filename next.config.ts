import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@modelcontextprotocol/sdk"],
};

export default nextConfig;
