import type { CollectionAfterDeleteHook } from "payload";
import { BOOKING_CANCELLED } from "@/collections/Emails/utils/email-types";
import type { Booking } from "@/payload-types";
import { sendBookingEmail } from "../utils/send-booking-email";

export const cancelBookingEmail: CollectionAfterDeleteHook<Booking> = async ({
	context,
	doc,
}) => {
	if (!context?.triggerAfterChange) return;

	await sendBookingEmail({
		booking: doc,
		emailType: BOOKING_CANCELLED,
	});
};
