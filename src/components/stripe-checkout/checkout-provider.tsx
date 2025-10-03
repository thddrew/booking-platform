"use client";

import {
  createParser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  Parser,
  useQueryStates,
} from "nuqs";
import { CheckoutProvider as StripeCheckoutProvider } from "@stripe/react-stripe-js/checkout";
import { createContext, useContext, useMemo } from "react";
import { useStripeAppearance } from "@/hooks/use-stripe-appearance";
import { createCheckoutSessionSecret } from "@/lib/stripe/checkouts";
import { loadAccountStripe } from "@/lib/stripe/load-account-stripe";
import z from "zod";
import { useSearchParams } from "next/navigation";
import { parse } from "qs-esm";

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

export const useCheckoutAccount = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error(
      "useCheckoutAccount must be used within a CheckoutProvider"
    );
  }
  return context;
};

export const useCheckoutQueryStates = () => {
  const args = useQueryStates({
    tenantId: parseAsString,
    bookingId: parseAsString,
    stAccId: parseAsString,
    stCusId: parseAsString,
    stCusEmail: parseAsString,
    returnUrl: parseAsString,
    cancelUrl: parseAsString,
  } satisfies Record<Exclude<keyof CheckoutContextType, "items">, Parser<any>>);

  return args;
};

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
    setStates,
  ] = useCheckoutQueryStates();

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
