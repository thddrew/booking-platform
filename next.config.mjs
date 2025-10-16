import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Your Next.js config here
	// Enable webpack to follow symlinks for linked packages
	webpack: (config, { isServer }) => {
		config.resolve.symlinks = true;
		return config;
	},
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
