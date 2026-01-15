import type { Event } from "@/payload-types";

/**
 * Filters event prices to only include active prices with valid stripePriceIds
 */
export function filterValidPrices(event: Event): Event {
	return {
		...event,
		prices:
			event.prices?.filter(
				(price) =>
					price.isActive !== false &&
					typeof price.stripePriceId === "string" &&
					price.stripePriceId.length > 0,
			) || [],
	};
}
