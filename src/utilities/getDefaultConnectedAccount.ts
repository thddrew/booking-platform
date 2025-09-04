"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { getTenantFromCookie } from "@payloadcms/plugin-multi-tenant/utilities";
import { headers } from "next/headers";
import { isSuperAdmin } from "@/access/isSuperAdmin";
import { isSuperAdminOrTenantAdmin } from "@/access/isSuperAdminOrTenantAdmin";

export const getDefaultConnectedAccounts = async () => {
  const requestHeaders = await headers();
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: requestHeaders });

  const tenant = getTenantFromCookie(requestHeaders, "number") as number | null;

  if (!tenant) {
    // Super admin should impersonate a tenant to access a default connected account
    return null;
  }

  if (!isSuperAdminOrTenantAdmin(user, tenant)) {
    return null;
  }

  const data = await payload.find({
    collection: "connectedAccounts",
    where: {
      default: {
        equals: true,
      },
      tenant: {
        equals: tenant,
      },
    },
  });

  return data.docs;
};
