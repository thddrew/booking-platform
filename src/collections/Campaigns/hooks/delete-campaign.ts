import type { CollectionAfterDeleteHook } from "payload";
import { novu } from "@/lib/novu/client";
import type { Campaign } from "@/payload-types";

export const deleteCampaign: CollectionAfterDeleteHook<Campaign> = async ({
	doc,
}) => {
	if (!doc.id) {
		console.error("Campaign ID is required. Novu Topic deletion failed.");
		return;
	}

	await novu.topics.delete(doc.id);
};
