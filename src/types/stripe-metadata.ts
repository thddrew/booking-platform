import z from "zod";

const baseMetadata = z.object({
	tenantId: z.string().nullish(),
	accountId: z.string().nullish(),
});

export const stripeProductMetadata = baseMetadata.extend({
	eventId: z.string().nullish(),
});

export const stripePriceMetadata = baseMetadata.extend({
	eventId: z.string().nullish(),
	priceId: z.string().nullish(),
});

export const stripeCustomerMetadata = baseMetadata.extend({});

export const stripeCheckoutSessionMetadata = baseMetadata.extend({
	bookingId: z.string().nullish(),
});

/**
 * The metadata for a Stripe Product
 * @param eventId - The id of an event
 * @param tenantId - The id of a tenant
 */
export type StripeProductMetadata = z.infer<typeof stripeProductMetadata>;

/**
 * The metadata for a Stripe Price
 * @param eventId - The id of an event
 * @param tenantId - The id of a tenant
 * @param priceId - The id of a specific price for an event
 */
export type StripePriceMetadata = z.infer<typeof stripePriceMetadata>;

/**
 * The metadata for a Stripe Customer
 * @param tenantId - The id of a tenant
 */
export type StripeCustomerMetadata = z.infer<typeof stripeCustomerMetadata>;

/**
 * The metadata for a Stripe Checkout Session
 * @param tenantId - The id of a tenant
 * @param bookingId - The id of a booking
 */
export type StripeCheckoutSessionMetadata = z.infer<
	typeof stripeCheckoutSessionMetadata
>;
