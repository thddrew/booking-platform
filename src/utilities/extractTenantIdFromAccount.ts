import { ConnectedAccount } from "@/payload-types";

export const extractTenantIdFromAccount = (account: ConnectedAccount) => {
  if (typeof account.tenant === "number") {
    return account.tenant;
  }

  const tenantId =
    account?.tenant &&
    typeof account.tenant === "object" &&
    "id" in account.tenant
      ? account.tenant.id
      : undefined;

  return tenantId;
};
