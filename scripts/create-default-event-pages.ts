import configPromise from "@payload-config";
import { getPayload } from "payload";

async function createDefaultEventPages() {
	const payload = await getPayload({ config: configPromise });

	const tenants = await payload.find({
		collection: "tenants",
		limit: 1000,
	});

	console.log(`Found ${tenants.docs.length} tenants`);

	let created = 0;
	let skipped = 0;

	for (const tenant of tenants.docs) {
		const existingEventsPage = await payload.find({
			collection: "pages",
			where: {
				and: [
					{
						tenant: {
							equals: tenant.id,
						},
					},
					{
						slug: {
							equals: "events",
						},
					},
				],
			},
			limit: 1,
		});

		if (existingEventsPage.docs.length === 0) {
			await payload.create({
				collection: "pages",
				data: {
					slug: "events",
					title: "Events",
					tenant: tenant.id,
				},
			});
			console.log(`Created events page for tenant: ${tenant.name} (${tenant.slug})`);
			created++;
		} else {
			console.log(`Events page already exists for tenant: ${tenant.name} (${tenant.slug})`);
			skipped++;
		}
	}

	console.log(`\nCompleted: ${created} created, ${skipped} skipped`);
	process.exit(0);
}

createDefaultEventPages().catch((error) => {
	console.error("Error creating default event pages:", error);
	process.exit(1);
});


