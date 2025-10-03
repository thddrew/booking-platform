import type { Access } from "payload";
import { getUserTenantIDs } from "@/utilities/getUserTenantIDs";
import { isSuperAdmin } from "../../../access/isSuperAdmin";
import { Booking } from "@/payload-types";

/**
 * Tenant admins and super admins can will be allowed access.
 */
export const updateAccess: Access<Booking> = ({ req, data }) => {
  // if the booking payment process has been started, do not allow updates
  if (!!data?.paymentStatus) return false;

  if (!req.user) {
    return false;
  }

  if (isSuperAdmin(req.user)) {
    return true;
  }

  const adminTenantAccessIDs = getUserTenantIDs(req.user, "tenant-admin");
  const requestedTenant = req?.data?.tenant;

  if (requestedTenant && adminTenantAccessIDs.includes(requestedTenant)) {
    return true;
  }

  return false;
};
