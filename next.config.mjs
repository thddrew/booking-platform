import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  serverExternalPackages: ["@payloadcms/db-postgres"],
  async rewrites() {
    return [
      {
        source: "/((?!admin|api))tenant-domains/:path*",
        destination: "/tenant-domains/:tenant/:path*",
        has: [
          {
            type: "host",
            value: "(?<tenant>.*)",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
