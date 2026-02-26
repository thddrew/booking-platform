import type { Access } from "payload";
import { getUserTenantIDs } from "@/utilities/getUserTenantIDs";
import { isSuperAdmin } from "../../../access/isSuperAdmin";

/**
 * Tenant admins and super admins can will be allowed access
 */
export const superAdminOrTenantAdminAccess: Access = ({ req }) => {
	if (!req.user) {
		return false;
	}

	if (isSuperAdmin(req.user)) {
		return true;
	}

	const adminTenantAccessIDs = getUserTenantIDs(req.user, "tenant-admin");

	// If the request includes a specific tenant, verify the user has access to it
	const requestedTenant = req?.data?.tenant;
	if (requestedTenant && adminTenantAccessIDs.includes(requestedTenant)) {
		return true;
	}

	// For create operations where tenant is not yet set (multi-tenant plugin sets it in beforeChange),
	// allow access if the user has tenant-admin role on any tenant
	if (!requestedTenant && adminTenantAccessIDs.length > 0) {
		return true;
	}

	return false;
};
