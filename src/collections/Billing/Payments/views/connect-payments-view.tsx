"use client";

import { toast } from "@payloadcms/ui";
import {
  loadConnectAndInitialize,
  type StripeConnectInstance,
} from "@stripe/connect-js";
import {
  ConnectComponentsProvider,
  ConnectPayments,
} from "@stripe/react-connect-js";
import { useEffect, useState } from "react";
import { createStripeDashboardSession } from "../../utils/stripe-account-sessions";
import { User } from "@/payload-types";

export const ConnectPaymentsView = ({
  accountId,
  tenant,
  user,
}: {
  user: User;
  accountId: string;
  tenant: number;
}) => {
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null);

  useEffect(() => {
    if (accountId) {
      setInstance(
        loadConnectAndInitialize({
          fetchClientSecret: async () => {
            const res = await createStripeDashboardSession(user, {
              account: accountId,
              tenant,
            });

            return res.clientSecret;
          },
          publishableKey: process.env
            .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
          appearance: {
            overlays: "drawer",
          },
        })
      );
    }
  }, [accountId]);

  if (!instance) {
    return null;
  }

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      <ConnectPayments
        onLoadError={(e) => {
          console.error(e);
          toast.error("Failed to load Stripe payments");
        }}
      />
    </ConnectComponentsProvider>
  );
};

export default ConnectPaymentsView;
