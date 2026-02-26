import configPromise from "@payload-config";
import type { MetadataRoute } from "next";
import { getPayload } from "payload";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:4000"; // pragma: allowlist secret
	const payload = await getPayload({ config: configPromise });

	const entries: MetadataRoute.Sitemap = [
		{ url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
		{ url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
	];

	try {
		const tenants = await payload.find({
			collection: "tenants",
			overrideAccess: true,
			where: { allowPublicRead: { equals: true } },
			limit: 100,
		});

		for (const tenant of tenants.docs) {
			entries.push({
				url: `${baseUrl}/tenant-slugs/${tenant.slug}/events`,
				lastModified: new Date(tenant.updatedAt),
				changeFrequency: "daily",
				priority: 0.9,
			});

			const events = await payload.find({
				collection: "events",
				overrideAccess: true,
				where: {
					and: [
						{ tenant: { equals: tenant.id } },
						{ isActive: { equals: true } },
						{ _status: { equals: "published" } },
					],
				},
				limit: 500,
			});

			for (const event of events.docs) {
				entries.push({
					url: `${baseUrl}/tenant-slugs/${tenant.slug}/events/${event.slug}`,
					lastModified: new Date(event.updatedAt),
					changeFrequency: "weekly",
					priority: 0.7,
				});
			}
		}
	} catch (err) {
		console.error("Sitemap generation error:", err);
	}

	return entries;
}
