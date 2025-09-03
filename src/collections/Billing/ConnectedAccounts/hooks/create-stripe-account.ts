import type { CollectionBeforeChangeHook } from "payload";
import { stripe } from "@/lib/stripe";
import type { ConnectedAccount } from "@/payload-types";

export const createStripeAccount: CollectionBeforeChangeHook<
  ConnectedAccount
> = async ({ data, context, operation }) => {
  if (context?.triggerAfterChange === false) {
    return;
  }

  if (operation === "create" && !data.stripeAccountId) {
    try {
      const account = await stripe.accounts.create({
        controller: {
          stripe_dashboard: {
            type: "none",
          },
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        country: "CA",
      });

      if (account.id) {
        data.stripeAccountId = account.id;
      }

      return data;
    } catch (error: any) {
      console.error(
        "An error occurred when calling the Stripe API to create an account:",
        error
      );

      return data;
    }
  }
};
