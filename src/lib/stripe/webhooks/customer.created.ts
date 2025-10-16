import type { StripeWebhookHandler } from "@payloadcms/plugin-stripe/types";
import type Stripe from "stripe";
import { stripeCustomerMetadata } from "@/types/stripe-metadata";

export const customerCreatedWebhook: StripeWebhookHandler<
	Stripe.CustomerCreatedEvent
> = async ({ event, payload, req }) => {
	try {
		const { id, name, email, phone, metadata } = event.data.object;

		const customerMetadata = stripeCustomerMetadata.safeParse(metadata);

		const [firstName, lastName] = name?.split(" ") ?? [];

		await payload.create({
			req,
			collection: "customers",
			data: {
				stripeCustomerId: id,
				firstName,
				lastName,
				email: email ?? `${id}@stripe.com`,
				phone,
				tenant: customerMetadata.data?.tenantId,
			},
			context: {
				triggerAfterChange: false,
			},
		});
	} catch (err) {
		console.error(
			"An error occurred when calling the Stripe API to create a customer:",
			err,
		);
	}
};
