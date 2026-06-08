import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Drizzle/postgres-js DB client and Inngest run in the Node.js runtime,
  // not the Edge runtime. Server Actions and route handlers that touch the DB
  // must declare `export const runtime = "nodejs"`.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
