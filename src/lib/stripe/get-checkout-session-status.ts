import { isTypedObject } from "@/utilities/isTypedObject";
import Stripe from "stripe";

/**
 * Get the status of a Stripe checkout session. If the checkout session has a refund,
 * it will return the status as "refunded" and the amount refunded.
 */
export const getCheckoutSessionStatus = (
  checkoutSession: Stripe.Response<Stripe.Checkout.Session>
) => {
  const latestCharge = isTypedObject<Stripe.PaymentIntent>(
    checkoutSession.payment_intent
  )
    ? isTypedObject<Stripe.Charge>(checkoutSession.payment_intent.latest_charge)
      ? checkoutSession.payment_intent.latest_charge
      : null
    : null;

  if (latestCharge?.refunded) {
    return {
      status: "refunded",
      amountRefunded: latestCharge.amount_refunded,
      latestCharge,
    };
  }

  return {
    status: checkoutSession.status,
    latestCharge,
  };
};
