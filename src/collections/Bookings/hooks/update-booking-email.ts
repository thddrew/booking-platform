import type { CollectionAfterChangeHook } from "payload";
import { BOOKING_UPDATED } from "@/collections/Emails/utils/email-types";
import type { Booking } from "@/payload-types";
import { getSignificantChanges } from "../utils/booking-comparison";
import { sendBookingEmail } from "../utils/send-booking-email";

export const updateBookingEmail: CollectionAfterChangeHook<Booking> = async ({
	operation,
	context,
	doc,
	previousDoc,
}) => {
	if (!context?.triggerAfterChange) return;

	if (operation === "update" && previousDoc) {
		const significantChanges = getSignificantChanges(previousDoc, doc);

		// Only send email if there are significant changes
		if (
			significantChanges.schedule ||
			significantChanges.customer ||
			significantChanges.payment
		) {
			await sendBookingEmail({
				booking: doc,
				emailType: BOOKING_UPDATED,
				previousBooking: previousDoc,
			});
		}
	}
};
