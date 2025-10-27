import type { CollectionAfterChangeHook } from "payload";
import { BOOKING_CONFIRMATION } from "@/collections/Emails/utils/email-types";
import type { Booking } from "@/payload-types";
import { sendBookingEmail } from "../utils/send-booking-email";

export const newBookingEmail: CollectionAfterChangeHook<Booking> = async ({
	operation,
	context,
	doc,
}) => {
	const isNewBooking =
		operation === "create" && doc.paymentMethod === "payLater";

	const isNewPaidBooking =
		operation === "update" &&
		doc.paymentMethod === "payNow" &&
		context?.isStripePaid;

	if (isNewBooking || isNewPaidBooking) {
		await sendBookingEmail({
			booking: doc,
			emailType: BOOKING_CONFIRMATION,
		});
	}
};
