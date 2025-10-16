import Stripe from "stripe";
import { getTenantDefaultConnectedAccount } from "@/utilities/getTenantDefaultConnectedAccount";

/**
 * Get the Stripe node client for the current connected account
 */
export const getDefaultAccountStripeClient = async () => {
	const account = await getTenantDefaultConnectedAccount();

	if (!account) {
		throw new Error("No connected account found");
	}

	if (!account.stripeAccountId) {
		throw new Error("No stripe account ID connected to the default account");
	}

	return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
		apiVersion: "2025-08-27.basil",
		stripeAccount: account.stripeAccountId,
	});
};

export const getAccountStripeClient = async (stripeAccount: string) => {
	return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
		apiVersion: "2025-08-27.basil",
		stripeAccount,
	});
};
