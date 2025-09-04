"use client";

import { toast } from "@payloadcms/ui";
import { ConnectPayments } from "@stripe/react-connect-js";
import { createStripeDashboardSession } from "@/lib/stripe/account-sessions";
import { User } from "@/payload-types";
import StripeConnect from "@/components/stripe-connect";

export const ConnectPaymentsView = ({
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

export default ConnectPaymentsView;
