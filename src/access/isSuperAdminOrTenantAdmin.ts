import type { ClientUser } from "payload";
import type { User } from "@/payload-types";
import { getUserTenantIDs } from "@/utilities/getUserTenantIDs";
import { isSuperAdmin } from "./isSuperAdmin";

/**
 * Tenant admins and super admins can will be allowed access
 */
export const isSuperAdminOrTenantAdmin = (
  user: ClientUser | User | null,
  requestedTenant: number | null
) => {
  if (!user) {
    return false;
  }

  if (isSuperAdmin(user)) {
    return true;
  }

  const adminTenantAccessIDs = getUserTenantIDs(user, "tenant-admin");

  if (requestedTenant && adminTenantAccessIDs.includes(requestedTenant)) {
    return true;
  }

  return false;
};
