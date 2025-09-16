"use server";

import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import type { ListViewServerProps } from "payload";
import { extractTenantIdFromAccount } from "@/utilities/extractTenantIdFromAccount";
import { getDefaultConnectedAccounts } from "@/utilities/getDefaultConnectedAccount";
import PaymentMethods from "./payment-methods";

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
      <PaymentMethods
        user={args.user}
        accountId={account.stripeAccountId}
        tenant={tenantId}
      />
    </Gutter>
  );
};

export default ListView;
