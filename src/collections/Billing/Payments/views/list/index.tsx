"use server";

import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import { ListViewServerProps } from "payload";
import ConnectPaymentsView from "./connect-payments";
import { getDefaultConnectedAccounts } from "@/utilities/getDefaultConnectedAccount";
import { extractTenantIdFromAccount } from "@/utilities/extractTenantIdFromAccount";

export const ListView = async (args: ListViewServerProps) => {
  const data = await getDefaultConnectedAccounts();

  if (!data) {
    return <Gutter>No connected accounts</Gutter>;
  }

  const account = data[0];
  const tenantId = extractTenantIdFromAccount(account);

  if (!args.user) {
    redirect("/login");
  }

  if (!tenantId) {
    return <Gutter>No tenant selected</Gutter>;
  }

  if (!account.stripeAccountId) {
    return <Gutter>No stripe account ID</Gutter>;
  }

  return (
    <Gutter>
      <ConnectPaymentsView
        user={args.user}
        accountId={account.stripeAccountId}
        tenant={tenantId}
      />
    </Gutter>
  );
};

export default ListView;
