import { getAccountStripe } from "@/lib/stripe/get-account-stripe";
import { Customer } from "@/payload-types";
import { StripeCustomerMetadata } from "@/types/stripe-metadata";
import { extractID } from "@/utilities/extractID";
import { CollectionBeforeChangeHook } from "payload";

export const updateStripeCustomer: CollectionBeforeChangeHook<
  Customer
> = async ({ data, operation }) => {
  if (operation === "update") {
    const stripe = await getAccountStripe();

    if (!data.stripeCustomerId) {
      console.error(
        "No stripe customer id found during update, DEVELOPER PLEASE HANDLE THIS CASE",
        data.stripeCustomerId
      );
    }

    if (data.stripeCustomerId) {
      try {
        await stripe.customers.update(data.stripeCustomerId, {
          phone: data.phone ?? undefined,
          email: data.email ?? undefined,
          name: data.name ?? undefined,
          metadata: {
            tenantId: data.tenant ? extractID(data.tenant) : null,
          } satisfies StripeCustomerMetadata,
        });
      } catch (err) {
        console.error(
          "An error occurred when calling the Stripe API to update a customer:",
          err
        );
      }
    }
  }

  return data;
};
