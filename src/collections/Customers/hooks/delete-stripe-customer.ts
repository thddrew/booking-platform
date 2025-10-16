import type { CollectionAfterDeleteHook } from "payload";
import { getDefaultAccountStripeClient } from "@/lib/stripe/get-account-stripe";
import type { Customer } from "@/payload-types";

export const deleteStripeCustomer: CollectionAfterDeleteHook<
	Customer
> = async ({ doc }) => {
	const stripe = await getDefaultAccountStripeClient();

	if (!doc.stripeCustomerId) {
		console.error(
			"No stripe customer id found during delete, DEVELOPER PLEASE HANDLE THIS CASE",
			doc.id,
		);

		return;
	}

	try {
		await stripe.customers.del(doc.stripeCustomerId);
	} catch (err) {
		console.error(
			"An error occurred when calling the Stripe API to update a customer:",
			err,
		);
	}
};
