import type { AdminViewServerProps } from "payload";

import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import React from "react";
import { CheckoutProvider } from "./checkout-provider";
import { CheckoutForm } from "./checkout-form";

async function CheckoutView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter className="mb-28">
        <CheckoutProvider>
          <CheckoutForm />
        </CheckoutProvider>
      </Gutter>
    </DefaultTemplate>
  );
}

export default CheckoutView;
