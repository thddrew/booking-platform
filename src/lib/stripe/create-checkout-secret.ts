"use server";

import type Stripe from "stripe";
import type { StripeCheckoutSessionMetadata } from "@/types/stripe-metadata";
import { getDefaultAccountStripeClient } from "./get-account-stripe";

export const createCheckoutSessionSecret = async ({
	lineItems,
	promotionCode,
	customerId,
	customerEmail,
	returnUrl,
	tenantId,
	bookingId,
}: {
	lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
	promotionCode?: string;
	customerId?: string;
	customerEmail?: string;
	returnUrl?: string;
} & StripeCheckoutSessionMetadata) => {
	const stripe = await getDefaultAccountStripeClient();

	if (!lineItems.length) {
		throw new Error("Line items are required");
	}

	try {
		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			// For embedded components
			ui_mode: "custom",
			line_items: lineItems,
			discounts: [{ promotion_code: promotionCode }],
			customer: customerId,
			customer_email: customerEmail,
			// 1 hour from now
			expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
			return_url: returnUrl,
			metadata: {
				tenantId: tenantId ?? null,
				bookingId: bookingId ?? null,
			} satisfies StripeCheckoutSessionMetadata,
		});

		return session.client_secret;
	} catch (err) {
		throw new Error(`Failed to create checkout session: ${err}`);
	}
};
