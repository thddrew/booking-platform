/**
 * Load the tenant's default connected account details and pass to stripe notification banner
 */
"use server";

import type { ServerProps } from "payload";
import { extractID } from "@/utilities/extractID";
import { getTenantDefaultConnectedAccount } from "@/utilities/getTenantDefaultConnectedAccount";
import { StripeNotificationBannerClient } from "./banner.client";

const StripeNotificationBannerServer = async (args: ServerProps) => {
	const account = await getTenantDefaultConnectedAccount();

	if (!account || !args.user) return null;

	const tenantId = extractID(account);

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
