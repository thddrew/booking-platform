import type { StripeWebhookHandler } from "@payloadcms/plugin-stripe/types";
import type Stripe from "stripe";
import type { StripeMetadata } from "@/types/stripe-metadata";

export const customerCreatedWebhook: StripeWebhookHandler<
  Stripe.CustomerCreatedEvent
> = async ({ event, payload, req }) => {
  try {
    const { id, name, email, phone, metadata } = event.data.object;

    await payload.create({
      req,
      collection: "customers",
      data: {
        stripeCustomerId: id,
        name: name ?? `name-${id}`,
        email: email ?? `${id}@stripe.com`,
        phone,
        tenant: Number((metadata satisfies StripeMetadata).tenantId),
      },
      context: {
        triggerAfterChange: false,
      },
    });
  } catch (err) {
    console.error(
      "An error occurred when calling the Stripe API to create a customer:",
      err
    );
  }
};
