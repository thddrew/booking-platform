import type { StripeWebhookHandler } from "@payloadcms/plugin-stripe/types";
import type Stripe from "stripe";

export const customerCreatedWebhook: StripeWebhookHandler<
  Stripe.CustomerCreatedEvent
> = async ({ event }) => {
  console.log(event);
};
