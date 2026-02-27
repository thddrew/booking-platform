"use server";

import configPromise from "@payload-config";
import { getPayload } from "payload";
import { CustomerSchema } from "@/collections/Customers/utils/schemas";
import type {
	BOOKING_CANCELLED,
	BOOKING_CONFIRMATION,
	BOOKING_REMINDER,
	BOOKING_UPDATED,
} from "@/collections/Emails/utils/email-types";
import { logSentEmail } from "@/collections/Emails/utils/log-sent-email";
import { renderBookingEmail } from "@/collections/Emails/utils/render-emails";
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

	const customerEmail = customer.data.email;
	if (!customerEmail) {
		console.warn("No customer email found, skipping email send");
		return;
	}

	const { emailId, renderedEmail } = await renderBookingEmail({
		emailType,
		context: {
			booking,
			customer: customer.data,
			previousBooking,
		},
	});

	const payload = await getPayload({ config: configPromise });

	// Get tenant info for the from address
	const tenantId = extractID(booking.tenant);
	let fromName = "Bookify";
	let tenantDoc: {
		name?: string;
		emailDomainVerified?: boolean | null;
		emailDomain?: string | null;
	} | null = null;
	try {
		if (tenantId) {
			tenantDoc = await payload.findByID({
				collection: "tenants",
				id: tenantId,
				overrideAccess: true,
			});
			if (tenantDoc?.name) {
				fromName = tenantDoc.name;
			}
		}
	} catch {
		// Fall back to default
	}

	const fromAddress =
		tenantDoc?.emailDomainVerified && tenantDoc?.emailDomain
			? `${fromName} <bookings@${tenantDoc.emailDomain}>`
			: undefined;

	try {
		await payload.sendEmail({
			...(fromAddress ? { from: fromAddress } : {}),
			to: customerEmail,
			subject: renderedEmail.subject,
			html: renderedEmail.body,
		});
	} catch (err) {
		console.error("Failed to send email via Resend:", err);
		throw err;
	}

	try {
		await logSentEmail({
			emailId,
			workflowId: "direct-resend",
			transactionId: `resend-${Date.now()}`,
			createdAt: new Date().toISOString(),
		});
	} catch {
		// Non-critical — log failure shouldn't break the booking
	}
};
