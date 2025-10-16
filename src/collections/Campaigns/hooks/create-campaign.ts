import type { CollectionAfterChangeHook } from "payload";
import { novu } from "@/lib/novu/client";
import type { Campaign } from "@/payload-types";
import { extractID } from "@/utilities/extractID";

export const createCampaign: CollectionAfterChangeHook<Campaign> = async ({
	context,
	operation,
	doc,
}) => {
	if (context?.triggerAfterChange === false) {
		return;
	}

	if (operation === "create") {
		if (!doc.id) {
			console.error("Campaign ID is required. Novu Topic creation failed.");
			return;
		}

		const tenantId = doc.tenant ? extractID(doc.tenant) : null;

		await novu.topics.subscriptions.create(
			{
				subscriberIds:
					doc.subscribers?.map((subscriber) =>
						[tenantId, extractID(subscriber)].join(":"),
					) ?? [],
			},
			doc.id,
		);
	}
};
