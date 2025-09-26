import z from "zod";

export const stripeProductMetadata = z.object({
  eventId: z.number().nullable().optional(),
  tenantId: z.number().nullable().optional(),
});

export const stripePriceMetadata = z.object({
  eventId: z.number().nullable().optional(),
  tenantId: z.number().nullable().optional(),
  priceId: z.string().nullable().optional(),
});

export const stripeCustomerMetadata = z.object({
  tenantId: z.number().nullable().optional(),
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
