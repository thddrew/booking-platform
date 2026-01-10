"use server";

import Stripe from "stripe";
import type { StripeCheckoutSessionMetadata } from "@/types/stripe-metadata";

interface CreatePaymentCheckoutSessionParams {
	bookingId: string;
	tenantId: string;
	stripeAccountId: string;
	customerEmail: string;
	pricingSnapshot: Record<string, unknown>;
	successUrl: string;
}

/**
 * Create a Stripe Checkout session for the public payment flow
 */
export async function createPaymentCheckoutSession({
	bookingId,
	tenantId,
	stripeAccountId,
	customerEmail,
	pricingSnapshot,
	successUrl,
}: CreatePaymentCheckoutSessionParams): Promise<string> {
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
		apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
		stripeAccount: stripeAccountId,
	});

	// Convert pricing snapshot to Stripe line items
	const prices = Object.values(pricingSnapshot) as Array<{
		stripePriceId?: string;
		amount?: number;
		label?: string;
		quantity?: number;
	}>;

	const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = prices
		.filter((price) => price.stripePriceId)
		.map((price) => ({
			price: price.stripePriceId as string,
			quantity: price.quantity || 1,
		}));

	if (lineItems.length === 0) {
		throw new Error("No valid line items found for checkout");
	}

	try {
		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			ui_mode: "custom",
			line_items: lineItems,
			customer_email: customerEmail,
			expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
			return_url: successUrl,
			metadata: {
				tenantId,
				bookingId,
			} satisfies StripeCheckoutSessionMetadata,
		});

		if (!session.client_secret) {
			throw new Error("Failed to create checkout session");
		}

		return session.client_secret;
	} catch (err) {
		console.error("Failed to create Stripe checkout session:", err);
		throw new Error("Failed to initialize payment");
	}
}
