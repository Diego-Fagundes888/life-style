import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable aggressive caching in development
  async headers() {
    // Only apply in development
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/:path*.(css|js|woff|woff2)",
          headers: [
            {
              key: "Cache-Control",
              value: "no-cache, no-store, must-revalidate",
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
