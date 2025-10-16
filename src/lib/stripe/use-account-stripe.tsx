import React from "react";
import Stripe from "stripe";
import { loadAccountStripe } from "./load-account-stripe";

/**
 * Hook to load the Stripe js client for the connected account
 */
export const useAccountStripe = (stripeAccountId?: string | null) => {
	const [loading, setLoading] = React.useState(!!stripeAccountId);
	const [stripe, setStripe] = React.useState<Stripe | null>(null);
	const abortControllerRef = React.useRef<AbortController | null>(null);

	React.useEffect(() => {
		if (stripeAccountId) {
			// Cancel previous request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			const abortController = new AbortController();
			abortControllerRef.current = abortController;

			const loadStripe = async () => {
				setLoading(true);

				try {
					const stripe = await loadAccountStripe(stripeAccountId);

					// Check if this request was cancelled
					if (!abortController.signal.aborted) {
						if (stripe instanceof Stripe) {
							setStripe(stripe);
						}
						setLoading(false);
					}
				} catch (_error) {
					if (!abortController.signal.aborted) {
						setLoading(false);
					}
				}
			};

			loadStripe();
		}

		// Cleanup on unmount or dependency change
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [stripeAccountId]);

	return {
		stripe,
		loading,
	};
};
