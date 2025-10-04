"use client";

import { ConnectNotificationBanner } from "@stripe/react-connect-js";
import { createStripeNotificationBannerSession } from "@/lib/stripe/account-sessions";
import type { User } from "@/payload-types";
import StripeConnect from "../stripe-connect";

export const StripeNotificationBannerClient = ({
  account,
  tenant,
  user,
}: {
  account: string;
  tenant: string;
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
