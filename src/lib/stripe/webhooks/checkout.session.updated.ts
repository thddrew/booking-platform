import type { StripeWebhookHandler } from "@payloadcms/plugin-stripe/types";
import type Stripe from "stripe";
import { stripeCheckoutSessionMetadata } from "@/types/stripe-metadata";

/**
 * This checks for both completed and expired sessions.
 */
export const checkoutSessionUpdatedWebhook: StripeWebhookHandler<
	| Stripe.CheckoutSessionCompletedEvent
	| Stripe.CheckoutSessionExpiredEvent
	| Stripe.CheckoutSessionAsyncPaymentSucceededEvent
	| Stripe.CheckoutSessionAsyncPaymentFailedEvent
> = async ({ event, payload, req }) => {
	try {
		const { id, status, metadata } = event.data.object;

		const checkoutSessionMetadata =
			stripeCheckoutSessionMetadata.safeParse(metadata);

		if (!checkoutSessionMetadata.success) {
			throw new Error("Invalid metadata", {
				cause: checkoutSessionMetadata.error,
			});
		}

		if (!checkoutSessionMetadata.data?.bookingId) {
			throw new Error("No booking id found", {
				cause: { checkoutSessionId: id },
			});
		}

		if (!checkoutSessionMetadata.data?.accountId) {
			throw new Error("No account id found", {
				cause: { checkoutSessionId: id },
			});
		}

		await payload.update({
			req,
			collection: "bookings",
			id: checkoutSessionMetadata.data?.bookingId,
			data: {
				paymentStatus: status,
			},
			context: {
				triggerAfterChange: false,
				isStripePaid: true,
			},
		});
	} catch (err) {
		console.error(
			"An error occurred when calling the Stripe API to create a customer:",
			err,
		);
	}
};
