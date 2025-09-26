"use client";

/**
 * Must be wrapped in a CheckoutProvider
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentElement, useCheckout } from "@stripe/react-stripe-js/checkout";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";

const formSchema = z.object({
  email: z.email(),
});

export const CheckoutForm = () => {
  const checkoutState = useCheckout();
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(formSchema),
  });

  const validateStripeEmail = async (email: string) => {
    if (checkoutState.type === "success") {
      const { checkout } = checkoutState;
      const result = await checkout.updateEmail(email);
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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data);

    try {
      const { isValid, message } = await validateStripeEmail(data.email);

      if (!isValid) {
        form.setError("email", { message });

        return;
      }
    } catch (err) {
      setRootError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
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

  // can't use a form here because the root edit view is a form
  return (
    <div className="twp space-y-6">
      <Input
        placeholder="Email"
        {...form.register("email")}
      />
      <h4>Payment</h4>
      <PaymentElement
        options={{
          layout: "auto",
        }}
      />
      <Button
        type="submit"
        onClick={form.handleSubmit(onSubmit)}
      >
        Submit
      </Button>
    </div>
  );
};
