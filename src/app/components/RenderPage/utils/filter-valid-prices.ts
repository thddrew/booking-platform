import type { Event } from "@/payload-types";

/**
 * Filters event prices to only include active prices that are bookable.
 * Paid prices (amount > 0) require a valid stripePriceId.
 * Free prices (amount === 0) are included even without a stripePriceId.
 */
export function filterValidPrices(event: Event): Event {
	return {
		...event,
		prices:
			event.prices?.filter((price) => {
				if (price.isActive === false) return false;
				const hasStripePriceId =
					typeof price.stripePriceId === "string" &&
					price.stripePriceId.length > 0;
				const isFree = price.amount === 0;
				return hasStripePriceId || isFree;
			}) || [],
	};
}
