/**
 * We use this to temporarily set the payment status in the db while we await the webhook
 * Eventually, the status in the db will be set to the actual status from the webhook Stripe.PaymentIntent.Status
 */
export const PAYMENT_STATUS = {
	processing: "processing",
};
