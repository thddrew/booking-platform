import configPromise from "@payload-config";
import { serve } from "@upstash/workflow/nextjs";
import { getPayload } from "payload";
import { sendBookingEmail } from "@/collections/Bookings/utils/send-booking-email";
import { BOOKING_REMINDER } from "@/collections/Emails/utils/email-types";

type BookingReminderPayload = {
	bookingId: string;
};

export const { POST } = serve<BookingReminderPayload>(async (context) => {
	const { bookingId } = context.requestPayload;

	const booking = await context.run("fetch-booking", async () => {
		const payload = await getPayload({ config: configPromise });

		const result = await payload.findByID({
			collection: "bookings",
			id: bookingId,
			overrideAccess: true,
		});

		if (!result || result.deletedAt) return null;
		if (!result.enableReminders) return null;

		return {
			id: result.id,
			dtstart: result.dtstart,
			enableReminders: result.enableReminders,
			tenant:
				typeof result.tenant === "string" ? result.tenant : result.tenant?.id,
		};
	});

	if (!booking) return;

	const reminderTime =
		new Date(booking.dtstart).getTime() - 24 * 60 * 60 * 1000;
	const now = Date.now();

	if (reminderTime > now) {
		await context.sleepUntil(
			"wait-until-reminder-time",
			new Date(reminderTime),
		);
	}

	const stillValid = await context.run("verify-booking", async () => {
		const payload = await getPayload({ config: configPromise });

		try {
			const result = await payload.findByID({
				collection: "bookings",
				id: bookingId,
				overrideAccess: true,
			});

			if (!result || result.deletedAt) return false;
			if (!result.enableReminders) return false;
			return true;
		} catch {
			return false;
		}
	});

	if (!stillValid) return;

	await context.run("send-reminder-email", async () => {
		const payload = await getPayload({ config: configPromise });

		const fullBooking = await payload.findByID({
			collection: "bookings",
			id: bookingId,
			overrideAccess: true,
		});

		if (!fullBooking) return;

		await sendBookingEmail({
			booking: fullBooking,
			emailType: BOOKING_REMINDER,
		});
	});
}, {});
