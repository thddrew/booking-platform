"use client";

import { CheckoutProvider } from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo } from "react";
import { useStripeAppearance } from "@/hooks/use-stripe-appearance";
import { createCheckoutSessionSecret } from "@/lib/stripe/checkouts";

export const CheckoutProviderServer = ({
  lineItems,
  customerId,
  stripeAccount,
  children,
}: {
  lineItems: { stripePriceId: string; quantity: number }[];
  customerId?: string;
  stripeAccount?: string;
  children: React.ReactNode;
}) => {
  const appearance = useStripeAppearance();
  const stripePromise = useMemo(() => {
    return loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
      {
        stripeAccount,
      }
    );
  }, [stripeAccount]);

  const fetchClientSecret = async () => {
    try {
      // TODO: likely need to use a payload endpoint here instead of a server action on the client side
      const secret = await createCheckoutSessionSecret({
        lineItems: lineItems.map((price) => ({
          price: price.stripePriceId,
          quantity: price.quantity,
        })),
        customerId,
      });

      if (!secret) {
        throw new Error("Failed to create checkout session");
      }

      return secret;
    } catch (err: any) {
      throw new Error(err);
    }
  };

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
