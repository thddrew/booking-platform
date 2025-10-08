"use client";

import { toast } from "@payloadcms/ui";
import { ConnectPayments } from "@stripe/react-connect-js";
import StripeConnect from "@/components/stripe-connect";
import { createStripeDashboardSession } from "@/lib/stripe/create-account-sessions";
import type { User } from "@/payload-types";

export const PaymentMethods = ({
  accountId,
  tenant,
  user,
}: {
  user: User;
  accountId: string;
  tenant: number;
}) => {
  return (
    <StripeConnect
      fetchClientSecret={async () => {
        const res = await createStripeDashboardSession(user, {
          account: accountId,
          tenant,
        });

        return res.clientSecret;
      }}
    >
      <ConnectPayments
        onLoadError={(e) => {
          console.error(e);
          toast.error("Failed to load Stripe payments");
        }}
      />
    </StripeConnect>
  );
};

export default PaymentMethods;
