import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-expect-error - this is a valid API version
  apiVersion: "2025-08-27.basil",
});
