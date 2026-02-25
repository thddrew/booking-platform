import type { CollectionAfterDeleteHook } from "payload";
import { BOOKING_CANCELLED } from "@/collections/Emails/utils/email-types";
import type { Booking } from "@/payload-types";
import { sendBookingEmail } from "../utils/send-booking-email";

export const cancelBookingEmail: CollectionAfterDeleteHook<Booking> = async ({
	context,
	doc,
}) => {
	if (!context?.triggerAfterChange) return;

	// Cancel scheduled reminder workflow
	if (doc.reminderWorkflowRunId) {
		try {
			const { Client } = await import("@upstash/workflow");
			const workflowClient = new Client({
				token: process.env.QSTASH_TOKEN || "",
			});
			await workflowClient.cancel({ ids: [doc.reminderWorkflowRunId] });
		} catch (err) {
			console.error("Failed to cancel reminder workflow:", err);
		}
	}

	await sendBookingEmail({
		booking: doc,
		emailType: BOOKING_CANCELLED,
	});
};
