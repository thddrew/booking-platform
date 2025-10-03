"use server";

import { Gutter, SetStepNav } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import type { ListViewServerProps } from "payload";
import { getDefaultAccountStripeClient } from "@/lib/stripe/get-account-stripe";
import { getTenantDefaultConnectedAccount } from "@/utilities/getTenantDefaultConnectedAccount";
import { paymentIntentsSearchParams } from "./params";
import { PaymentsTable } from "./payments-table.client";

export const ListView = async (
  args: ListViewServerProps & {
    searchParams: Promise<SearchParams>;
  }
) => {
  if (!args.user) {
    redirect("/login");
  }

  const { limit, after } = await paymentIntentsSearchParams.parse(
    args.searchParams
  );

  const defaultConnectedAccount = await getTenantDefaultConnectedAccount();
  const accountStripe = await getDefaultAccountStripeClient();

  const checkouts = await accountStripe.checkout.sessions.list({
    limit,
    starting_after: after ?? undefined,
    expand: [
      "data.customer",
      "data.line_items",
      "data.payment_intent.latest_charge",
    ],
  });

  return (
    <Gutter>
      <SetStepNav nav={[{ label: "Payments" }]} />
      <PaymentsTable
        data={checkouts.data}
        account={defaultConnectedAccount}
      />
    </Gutter>
  );
};

export default ListView;
