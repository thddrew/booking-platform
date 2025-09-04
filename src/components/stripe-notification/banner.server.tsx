/**
 * Load the tenant's default connected account details and pass to stripe notification banner
 */
"use server";

import { ServerProps } from "payload";
import { getDefaultConnectedAccounts } from "@/utilities/getDefaultConnectedAccount";
import { StripeNotificationBannerClient } from "./banner.client";
import { extractTenantIdFromAccount } from "@/utilities/extractTenantIdFromAccount";

const StripeNotificationBannerServer = async (args: ServerProps) => {
  const data = await getDefaultConnectedAccounts();

  if (!data || !args.user) return null;

  const account = data[0];
  const tenantId = extractTenantIdFromAccount(account);

  if (account?.stripeAccountId && tenantId) {
    return (
      <StripeNotificationBannerClient
        account={account.stripeAccountId}
        tenant={tenantId}
        user={args.user}
      />
    );
  }
};

export default StripeNotificationBannerServer;
