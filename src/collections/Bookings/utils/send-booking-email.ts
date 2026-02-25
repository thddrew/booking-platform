"use server";

import { waitUntil } from "@vercel/functions";
import { CustomerSchema } from "@/collections/Customers/utils/schemas";
import type {
	BOOKING_CANCELLED,
	BOOKING_CONFIRMATION,
	BOOKING_REMINDER,
	BOOKING_UPDATED,
} from "@/collections/Emails/utils/email-types";
import { logSentEmail } from "@/collections/Emails/utils/log-sent-email";
import { renderBookingEmail } from "@/collections/Emails/utils/render-emails";
import { createSubscriberId } from "@/lib/novu/create-subscriber-id";
import { emailWorkflow } from "@/lib/novu/workflow/email-workflow";
import type { Booking } from "@/payload-types";
import { extractID } from "@/utilities/extractID";

export const sendBookingEmail = async ({
	booking,
	emailType,
	previousBooking,
}: {
	booking: Booking;
	emailType:
		| typeof BOOKING_CONFIRMATION
		| typeof BOOKING_CANCELLED
		| typeof BOOKING_UPDATED
		| typeof BOOKING_REMINDER;
	previousBooking?: Booking | null;
}) => {
	if (!booking.tenant) {
		throw new Error("Missing tenant");
	}

	const customer = CustomerSchema.safeParse(booking.customerSnapshot);

	if (!customer.success) {
		throw new Error("Invalid customer snapshot", {
			cause: customer.error.message,
		});
	}

	const subscriberId = createSubscriberId(
		extractID(booking.tenant),
		customer.data.id,
	);

	const { emailId, renderedEmail } = await renderBookingEmail({
		emailType,
		context: {
			booking,
			customer: customer.data,
			previousBooking,
		},
	});

	const { data } = await emailWorkflow.trigger({
		to: {
			subscriberId,
		},
		payload: renderedEmail,
	});

	// @ts-expect-error - data type is wrong and there's a nested data object
	const transactionId = data.data?.transactionId;

	waitUntil(
		logSentEmail({
			emailId,
			workflowId: emailWorkflow.id,
			transactionId,
			createdAt: new Date().toISOString(),
		}),
	);

	return transactionId;
};
