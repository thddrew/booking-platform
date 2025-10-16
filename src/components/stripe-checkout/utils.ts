import type { EventPricesRecordType } from "@/collections/Events/utils/schemas";

export const convertPricingSnapshotToLineItems = (
	pricingSnapshot: EventPricesRecordType,
) => {
	return Object.values(pricingSnapshot).map((price) => ({
		stripePriceId: price.stripePriceId,
		quantity: price.quantity,
	}));
};
