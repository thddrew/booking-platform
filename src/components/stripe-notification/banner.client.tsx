"use client";

import { createStripeNotificationBannerSession } from "@/lib/stripe/account-sessions";
import { User } from "@/payload-types";
import StripeConnect from "../stripe-connect";
import { ConnectNotificationBanner } from "@stripe/react-connect-js";

export const StripeNotificationBannerClient = ({
  account,
  tenant,
  user,
}: {
  account: string;
  tenant: number;
  user: User;
}) => {
  return (
    <StripeConnect
      fetchClientSecret={async () => {
        const res = await createStripeNotificationBannerSession(user, {
          account,
          tenant,
        });

        return res.clientSecret;
      }}
    >
      <ConnectNotificationBanner
        onLoadError={(args) => {
          console.error("[StripeNotificationBannerClient] onLoadError", args);
        }}
      />
    </StripeConnect>
  );
};
