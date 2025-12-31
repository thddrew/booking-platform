import type { CollectionAfterChangeHook } from "payload";
import type { Tenant } from "@/payload-types";

export const createDefaultPages: CollectionAfterChangeHook<Tenant> = async ({
	doc,
	operation,
	req,
}) => {
	if (operation !== "create") {
		return;
	}

	if (!doc.id) {
		return;
	}

	const existingEventsPage = await req.payload.find({
		collection: "pages",
		where: {
			and: [
				{
					tenant: {
						equals: doc.id,
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
		await req.payload.create({
			collection: "pages",
			data: {
				slug: "events",
				title: "Events",
				tenant: doc.id,
			},
			req,
		});
	}
};

