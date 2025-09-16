"use server";

import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import type { ListViewServerProps } from "payload";
import { extractID } from "@/utilities/extractID";
import { getDefaultConnectedAccount } from "@/utilities/getDefaultConnectedAccount";
import PaymentsList from "./payments-list";

export const ListView = async (args: ListViewServerProps) => {
  const account = await getDefaultConnectedAccount();

  if (!account) {
    return <Gutter>No connected accounts</Gutter>;
  }

  const tenantId = extractID(account);

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
      <PaymentsList
        user={args.user}
        accountId={account.stripeAccountId}
        tenant={tenantId}
      />
    </Gutter>
  );
};

export default ListView;
