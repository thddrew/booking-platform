"use server";

import { isSuperAdminOrTenantAdmin } from "@/access/isSuperAdminOrTenantAdmin";
import { getTenantFromCookie } from "@payloadcms/plugin-multi-tenant/utilities";
import { Gutter } from "@payloadcms/ui";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ListViewServerProps } from "payload";
import { createStripeDashboardSession } from "../../utils/stripe-account-sessions";
import ConnectPaymentsView from "./connect-payments-view";

export const ListView = async (args: ListViewServerProps) => {
  const requestHeaders = await headers();
  const user = args.user;

  if (!user) {
    redirect("/login");
  }

  const tenantFromCookie = getTenantFromCookie(requestHeaders, "number") as
    | number
    | null;

  if (isSuperAdminOrTenantAdmin(user, tenantFromCookie)) {
    const connectedAccounts = await args.payload.find({
      collection: "connectedAccounts",
      where:
        tenantFromCookie !== null
          ? { tenant: { equals: tenantFromCookie } }
          : {},
    });

    const firstConnectedAccount = connectedAccounts.docs[0];

    if (!firstConnectedAccount) {
      return <Gutter>No connected accounts</Gutter>;
    }

    if (!firstConnectedAccount.stripeAccountId) {
      return <Gutter>No stripe account ID</Gutter>;
    }

    return (
      <Gutter>
        <ConnectPaymentsView
          user={user}
          accountId={firstConnectedAccount.stripeAccountId}
          tenant={firstConnectedAccount.tenant as number}
        />
      </Gutter>
    );
  }

  return <Gutter>No access</Gutter>;
};

export default ListView;
