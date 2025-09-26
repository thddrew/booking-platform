"use client";

/**
 * Must be wrapped in a CheckoutProvider
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
  PaymentElement,
  BillingAddressElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const formSchema = z.object({
  email: z.email(),
});

export const CheckoutForm = ({
  header,
  email,
  name,
  isStripeCustomer,
}: {
  header?: React.ReactNode;
  email?: string | null;
  /** If customer is passed in, email cannot be changed */
  isStripeCustomer?: boolean;
  name?: string | null;
}) => {
  const checkoutState = useCheckout();
  const [confirming, setConfirming] = useState<boolean>(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      email: email ?? "",
    },
    resolver: zodResolver(formSchema),
  });

  const validateStripeEmail = async (_email: string) => {
    if (checkoutState.type === "success") {
      const { checkout } = checkoutState;
      const result = await checkout.updateEmail(_email);
      const isValid = result.type === "success";

      return {
        isValid,
        message: isValid ? "Email updated successfully" : result.error?.message,
      };
    }

    return {
      isValid: false,
      message: "Stripe is not ready for payment yet",
    };
  };

  const onSubmit = async () => {
    const valid = await form.trigger();

    if (!valid) return;

    const data = form.getValues();
    console.log("data", data);

    try {
      if (!isStripeCustomer) {
        const { isValid, message } = await validateStripeEmail(data.email);

        if (!isValid) {
          form.setError("email", { message });

          return;
        }
      }

      if (checkout.canConfirm) {
        setConfirming(true);
        const confirmResult = await checkout.confirm({
          returnUrl: window.location.href,
        });

        if (confirmResult.type === "error") {
          setRootError(confirmResult.error?.message);

          return;
        }

        setSuccess(true);
        return;
      }

      console.log(checkout);

      throw new Error("Checkout cannot be confirmed");
    } catch (err) {
      setRootError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setSuccess(false);
    } finally {
      setConfirming(false);
    }
  };

  console.log(checkoutState);

  if (checkoutState.type === "loading") {
    return (
      <div className="twp">
        {/* TODO: add loading skeleton */}
        <Loader2Icon className="animate-spin" />
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <div className="twp">
        <p className="text-destructive">{checkoutState.error?.message}</p>
      </div>
    );
  }

  const { checkout } = checkoutState;

  // can't use a form here because the root edit view is a form
  return (
    <div className="twp space-y-6">
      {header}
      <div>
        <p className="font-bold mb-2">Summary:</p>
        <ul className="space-y-1">
          {checkout.lineItems.map((lineItem) => (
            <li
              key={lineItem.id}
              className="flex justify-between items-center"
            >
              <p>
                {lineItem.name} x {lineItem.quantity}
              </p>
              <p>{lineItem.subtotal.amount}</p>
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 gap-y-1">
          <p className="text-muted-foreground">Subtotal:</p>
          <p className="text-muted-foreground text-right">
            {checkout.total.subtotal.amount}
          </p>
          <p className="text-muted-foreground">Tax:</p>
          <p className="text-muted-foreground text-right">
            {checkout.total.taxExclusive.amount}
          </p>
          <p className="font-bold text-lg">Total:</p>
          <p className="font-bold text-lg font-mono text-right">
            {checkout.total.total.amount}
          </p>
        </div>
      </div>
      <p className="font-bold mb-2">Customer information:</p>
      <Tooltip>
        <TooltipTrigger
          disabled={!isStripeCustomer}
          asChild
        >
          <div>
            <Label
              htmlFor="email"
              className="mb-1"
            >
              Email
            </Label>
            <Input
              id="email"
              {...form.register("email", {
                disabled: isStripeCustomer,
              })}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="max-w-3xs"
        >
          Currently, email cannot be changed when using an active Stripe
          customer.
          <br />
          <br />
          Update the customer's email in the customer's profile.
        </TooltipContent>
      </Tooltip>
      <BillingAddressElement />
      <div>
        <p className="mb-1">Payment</p>
        <PaymentElement
          options={{
            layout: "auto",
          }}
        />
      </div>
      {rootError && <p className="text-destructive">{rootError}</p>}
      <Button
        className="w-full"
        onClick={onSubmit}
      >
        Pay
      </Button>
    </div>
  );
};
