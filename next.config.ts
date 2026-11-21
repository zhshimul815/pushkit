import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dashboard and API routes are dynamic (session + D1 backed).
  // Cache Components stay off so every dashboard page renders per-request.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
