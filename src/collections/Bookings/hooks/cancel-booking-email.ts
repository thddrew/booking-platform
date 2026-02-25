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

	// Notify waitlist entries for this timeslot
	try {
		const payload = await (await import("payload")).getPayload({
			config: (await import("@payload-config")).default,
		});

		const eventId =
			typeof doc.eventRelation === "string"
				? doc.eventRelation
				: doc.eventRelation?.id;

		if (eventId && doc.dtstart) {
			const waitlistEntries = await payload.find({
				collection: "waitlist",
				overrideAccess: true,
				where: {
					and: [
						{ event: { equals: eventId } },
						{ dtstart: { equals: doc.dtstart } },
						{ notified: { equals: false } },
					],
				},
				limit: 5,
				sort: "createdAt",
			});

			for (const entry of waitlistEntries.docs) {
				try {
					await payload.sendEmail({
						to: entry.email,
						subject: "A spot just opened up!",
						html: `
							<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
								<h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Good news${entry.firstName ? `, ${entry.firstName}` : ""}!</h1>
								<p style="font-size: 16px; color: #374151; line-height: 1.5; margin-bottom: 24px;">
									A spot just opened up for the event you were waiting for. Book now before it fills up again!
								</p>
								<p style="font-size: 14px; color: #6B7280;">
									If you no longer need this spot, you can safely ignore this email.
								</p>
							</div>
						`,
					});

					await payload.update({
						collection: "waitlist",
						id: entry.id,
						overrideAccess: true,
						data: { notified: true },
					});
				} catch (emailErr) {
					console.error("Failed to notify waitlist entry:", emailErr);
				}
			}
		}
	} catch (waitlistErr) {
		console.error("Failed to process waitlist notifications:", waitlistErr);
	}
};
