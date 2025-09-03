import type { CollectionAfterDeleteHook } from "payload";
import { stripe } from "@/lib/stripe";
import type { ConnectedAccount } from "@/payload-types";

export const removeStripeAccount: CollectionAfterDeleteHook<
  ConnectedAccount
> = async ({ doc }) => {
  if (doc.stripeAccountId) {
    try {
      await stripe.accounts.del(doc.stripeAccountId);

      return doc;
    } catch (error: any) {
      console.error(
        "An error occurred when calling the Stripe API to create an account:",
        error
      );

      return doc;
    }
  } else {
    return doc;
  }
};
