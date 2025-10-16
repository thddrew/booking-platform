import type { StripeWebhookHandler } from "@payloadcms/plugin-stripe/types";
import type Stripe from "stripe";
import { stripeCustomerMetadata } from "@/types/stripe-metadata";

export const customerDeletedWebhook: StripeWebhookHandler<
	Stripe.CustomerDeletedEvent
> = async ({ event, payload, req }) => {
	try {
		const { id, metadata } = event.data.object;

		const customerMetadata = stripeCustomerMetadata.safeParse(metadata);

		const customer = await payload.find({
			req,
			collection: "customers",
			where: {
				stripeCustomerId: {
					equals: id,
				},
				tenant: {
					equals: customerMetadata.data?.tenantId,
				},
			},
		});

		if (customer.totalDocs === 1) {
			await payload.delete({
				req,
				collection: "customers",
				id: customer.docs[0].id,
				context: {
					triggerAfterChange: false,
				},
			});

			return;
		}

		if (customer.totalDocs > 1) {
			throw new Error(`Multiple customers found for ${id}`);
		}

		throw new Error(`A customer ${id} not found`);
	} catch (err) {
		console.error(
			"An error occurred when calling the Stripe API to delete a customer:",
			err,
		);
	}
};
