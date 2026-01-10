import type { Access } from "payload";
import type { Booking } from "@/payload-types";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";

/**
 * Allows public creation of bookings (guest bookings) with validation,
 * or admin creation via superAdminOrTenantAdminAccess.
 *
 * Guest bookings must have:
 * - eventRelation
 * - customerSnapshot with email field
 * - dtstart and dtend
 */
export const createAccess: Access<Booking> = ({ req, data }) => {
	// Admins can always create
	if (req.user) {
		return superAdminOrTenantAdminAccess({ req, data });
	}

	// Public creation: validate required fields for guest bookings
	if (!data) {
		return false;
	}

	// Must have event relation
	if (!data.eventRelation) {
		return false;
	}

	// Must have start and end dates
	if (!data.dtstart || !data.dtend) {
		return false;
	}

	// Guest bookings: must have customer snapshot with email
	if (!data.customerRelation) {
		// If no customer relation, customerSnapshot must be provided with email
		if (!data.customerSnapshot || typeof data.customerSnapshot !== "object") {
			return false;
		}

		const customer =
			typeof data.customerSnapshot === "string"
				? JSON.parse(data.customerSnapshot)
				: data.customerSnapshot;

		if (!customer || typeof customer !== "object" || !customer.email) {
			return false;
		}
	}

	// All validations passed
	return true;
};
