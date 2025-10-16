"use client";

import { CheckoutProvider as StripeCheckoutProvider } from "@stripe/react-stripe-js/checkout";
import { useSearchParams } from "next/navigation";
import { type Parser, parseAsString, useQueryStates } from "nuqs";
import { parse } from "qs-esm";
import { createContext, useContext, useMemo } from "react";
import z from "zod";
import { useStripeAppearance } from "@/hooks/use-stripe-appearance";
import { createCheckoutSessionSecret } from "@/lib/stripe/create-checkout-secret";
import { loadAccountStripe } from "@/lib/stripe/load-account-stripe";

const checkoutContextSchema = z.object({
  items: z.array(
    z.object({
      stripePriceId: z.string(),
      quantity: z.preprocess(Number, z.number()),
    })
  ),
  tenantId: z.string(),
  bookingId: z.string(),
  stAccId: z.string().nullish(),
  stCusId: z.string().nullish(),
  stCusEmail: z.string().nullish(),
  returnUrl: z.string().nullish(),
  cancelUrl: z.string().nullish(),
});

export type CheckoutContextType = z.infer<typeof checkoutContextSchema>;

const CheckoutContext = createContext<CheckoutContextType>({
  items: [],
  bookingId: "",
  tenantId: "",
});

/**
 * Provides the checkout details from the query states to be used during the checkout process.
 * Not to be confused with Stripe's useCheckout which provides references to the Stripe Checkout object.
 */
export const useCheckoutDetails = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error(
      "useCheckoutDetails must be used within a CheckoutProvider"
    );
  }
  return context;
};

const checkoutQueryStatesSchema = {
  tenantId: parseAsString,
  bookingId: parseAsString,
  stAccId: parseAsString,
  stCusId: parseAsString,
  stCusEmail: parseAsString,
  returnUrl: parseAsString,
  cancelUrl: parseAsString,
} satisfies Record<Exclude<keyof CheckoutContextType, "items">, Parser<any>>;

export const CheckoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const appearance = useStripeAppearance();
  const [
    {
      tenantId,
      stAccId: stripeAccountId,
      stCusId: stripeCustomerId,
      stCusEmail: stripeCustomerEmail,
      bookingId,
      returnUrl,
      cancelUrl,
    },
    _setStates,
  ] = useQueryStates(checkoutQueryStatesSchema);

  const params = useSearchParams();
  const itemsSchema = checkoutContextSchema.pick({ items: true });
  const parsed = itemsSchema.parse(parse(params.toString()));

  const stripePromise = useMemo(() => {
    return stripeAccountId ? loadAccountStripe(stripeAccountId) : undefined;
  }, [stripeAccountId]);

  const fetchClientSecret = async () => {
    try {
      // TODO: likely need to use a payload endpoint here instead of a server action on the client side
      const secret = await createCheckoutSessionSecret({
        lineItems: parsed.items.map((price) => ({
          price: price.stripePriceId,
          quantity: price.quantity,
        })),
        customerId: stripeCustomerId ?? undefined,
        // Stripe doesn't allow both customerId and customerEmail to be set
        customerEmail: stripeCustomerId
          ? undefined
          : (stripeCustomerEmail ?? undefined),
        returnUrl: returnUrl ?? undefined,
        tenantId,
        bookingId,
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
    <CheckoutContext.Provider
      value={{
        items: parsed.items,
        tenantId: tenantId ?? "",
        bookingId: bookingId ?? "",
        stAccId: stripeAccountId,
        stCusId: stripeCustomerId,
        stCusEmail: stripeCustomerEmail,
        returnUrl,
        cancelUrl,
      }}
    >
      <StripeCheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret,
          elementsOptions: {
            appearance,
          },
        }}
      >
        {children}
      </StripeCheckoutProvider>
    </CheckoutContext.Provider>
  );
};
