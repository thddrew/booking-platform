import { useField } from "@payloadcms/ui";
import { useMemo } from "react";
import type { EventPriceType } from "@/collections/Events/utils/schemas";

/**
 * Hook to get the total amount and quantity of the pricing snapshot.
 * Automatically uses the pricing snapshot path.
 * Also provides functions to get the quantity and subtotal of a specific Price
 */
export const useEventPricingSummary = (path: string = "pricingSnapshot") => {
	const field = useField<Record<string, EventPriceType>>({
		path,
	});

	const { totalAmount, totalQuantity } = useMemo(() => {
		if (!field.value) return { totalAmount: 0, totalQuantity: 0 };

		let totalAmount = 0;
		let totalQuantity = 0;

		for (const price of Object.values(field.value)) {
			totalAmount += price.amount * (price.quantity ?? 0);
			totalQuantity += price.quantity ?? 0;
		}

		return { totalAmount, totalQuantity };
	}, [field.value]);

	const getPriceQuantity = (priceId?: string | null) => {
		if (!priceId) return 0;

		return field.value?.[priceId]?.quantity ?? 0;
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
