import { getDefaultAccountStripeClient } from "@/lib/stripe/get-account-stripe";
import { Customer } from "@/payload-types";
import { StripeCustomerMetadata } from "@/types/stripe-metadata";
import { extractID } from "@/utilities/extractID";
import { CollectionBeforeChangeHook } from "payload";

export const createStripeCustomer: CollectionBeforeChangeHook<
  Customer
> = async ({ data, operation }) => {
  if (operation === "create" && !data.stripeCustomerId) {
    const stripe = await getDefaultAccountStripeClient();

    try {
      const customer = await stripe.customers.create({
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        name: data.fullName ?? undefined,
        metadata: {
          tenantId: data.tenant ? extractID(data.tenant) : null,
        } satisfies StripeCustomerMetadata,
      });

      if (customer.id) {
        data.stripeCustomerId = customer.id;
      }
    } catch (err) {
      console.error(
        "An error occurred when calling the Stripe API to create a customer:",
        err
      );
    }
  }

  return data;
};
