import { loadStripe } from "@stripe/stripe-js";

/**
 * Load the Stripe js client for the connected account
 */
export const loadAccountStripe = async (stripeAccountId: string) => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string, {
    stripeAccount: stripeAccountId,
  });
};
