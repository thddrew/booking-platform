"use server";

import type Stripe from "stripe";
import { getAccountStripe } from "./get-account-stripe";

export const createCheckoutSessionSecret = async ({
  lineItems,
  promotionCode,
  customerId,
}: {
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  promotionCode?: string;
  customerId?: string;
}) => {
  const stripe = await getAccountStripe();

  if (!lineItems.length) {
    throw new Error("Line items are required");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // For embedded components
      ui_mode: "custom",
      line_items: lineItems,
      discounts: [{ promotion_code: promotionCode }],
      customer: customerId,
    });

    return session.client_secret;
  } catch (err) {
    throw new Error(`Failed to create checkout session: ${err}`);
  }
};
