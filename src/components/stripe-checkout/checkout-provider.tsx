"use client";

import { CheckoutProvider } from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo } from "react";
import { useStripeAppearance } from "@/hooks/use-stripe-appearance";
import { createCheckoutSessionSecret } from "@/lib/stripe/checkouts";
import { loadAccountStripe } from "@/lib/stripe/load-account-stripe";

export const CheckoutProviderServer = ({
  lineItems,
  customerId,
  stripeAccountId,
  customerEmail,
  children,
}: {
  lineItems: { stripePriceId: string; quantity: number }[];
  stripeAccountId?: string;
  /**
   * Only one of customerId or customerEmail is required
   */
  customerId?: string | null;
  customerEmail?: string | null;
  children: React.ReactNode;
}) => {
  const appearance = useStripeAppearance();
  const stripePromise = useMemo(() => {
    return stripeAccountId ? loadAccountStripe(stripeAccountId) : undefined;
  }, [stripeAccountId]);

  const fetchClientSecret = async () => {
    try {
      // TODO: likely need to use a payload endpoint here instead of a server action on the client side
      const secret = await createCheckoutSessionSecret({
        lineItems: lineItems.map((price) => ({
          price: price.stripePriceId,
          quantity: price.quantity,
        })),
        customerId: customerId ?? undefined,
        customerEmail: customerEmail ?? undefined,
      });

      if (!secret) {
        throw new Error("Failed to create checkout session");
      }

      return secret;
    } catch (err: any) {
      throw new Error(err);
    }
  };

  if (!stripePromise) {
    throw new Error("Stripe promise is undefined");
  }

  return (
    <CheckoutProvider
      stripe={stripePromise}
      options={{
        fetchClientSecret,
        elementsOptions: {
          appearance,
        },
      }}
    >
      {children}
    </CheckoutProvider>
  );
};
