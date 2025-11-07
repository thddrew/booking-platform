import { useField } from "@payloadcms/ui";
import { useMemo } from "react";
import type { EventPriceType } from "@/collections/Events/utils/schemas";

export const getEventPricingSummary = (
	pricingSnapshot: Record<string, EventPriceType>,
) => {
	let totalAmount = 0;
	let totalQuantity = 0;

	for (const price of Object.values(pricingSnapshot)) {
		totalAmount += price.amount * (price.quantity ?? 0);
		totalQuantity += price.quantity ?? 0;
	}

	const getPriceQuantity = (priceId?: string | null) => {
		if (!priceId) return 0;

		return pricingSnapshot?.[priceId]?.quantity ?? 0;
	};

	const getPriceSubtotal = (price: EventPriceType) => {
		if (!price.id) return 0;

		return getPriceQuantity(price.id) * price.amount;
	};

	return {
		totalAmount,
		totalQuantity,
		getPriceQuantity,
		getPriceSubtotal,
	};
};

/**
 * Hook to get the total amount and quantity of the pricing snapshot.
 * Automatically uses the pricing snapshot path.
 * Also provides functions to get the quantity and subtotal of a specific Price
 */
export const useEventPricingSummary = (path: string = "pricingSnapshot") => {
	const field = useField<Record<string, EventPriceType>>({
		path,
	});

	return useMemo(() => getEventPricingSummary(field.value), [field.value]);
};
