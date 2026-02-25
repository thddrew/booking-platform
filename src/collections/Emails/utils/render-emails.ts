import { type JSONContent, Maily } from "@thddrew/maily-render";
import { payloadSDK } from "@/lib/payload/payload-sdk";
import type { Booking, Customer, Email } from "@/payload-types";
import { extractID } from "@/utilities/extractID";
import { isTypedObject } from "@/utilities/isTypedObject";
import type {
	BOOKING_CANCELLED,
	BOOKING_CONFIRMATION,
	BOOKING_REMINDER,
	BOOKING_UPDATED,
} from "./email-types";
import {
	getVariables,
	getVariablesData,
	type VariablesContext,
} from "./variables";

/**
 * Generates the email subject and body for a Booking
 */
export const renderBookingEmail = async ({
	emailType,
	context,
}: {
	emailType:
		| typeof BOOKING_CONFIRMATION
		| typeof BOOKING_CANCELLED
		| typeof BOOKING_UPDATED
		| typeof BOOKING_REMINDER;
	context: {
		booking: Booking;
		customer: Customer;
		previousBooking?: Booking | null;
	};
}) => {
	const connectedEmail = context.booking[emailType];
	if (!connectedEmail) throw new Error(`Missing ${emailType} email on booking`);

	const email = await payloadSDK.findByID({
		collection: "emails",
		id: extractID(connectedEmail),
		draft: true,
	});
	if (!email) throw new Error(`Missing ${emailType} email`);

	const renderedEmail = await renderEmail({ email, context });

	return {
		emailId: email.id,
		renderedEmail,
	};
};

/**
 * Generates the email subject and body for an email
 */
export const renderEmail = async ({
	email,
	context,
}: {
	email: Email;
	context: VariablesContext;
}) => {
	const maily = isTypedObject<JSONContent>(email.emailContent)
		? new Maily(email.emailContent)
		: null;

	if (!maily) throw new Error(`Invalid email content`);

	maily.setPreviewText(email.preview ?? undefined);

	const variables = getVariables();
	const variablesData = getVariablesData({ variables, context });

	maily.setVariableValues(variablesData);

	return {
		subject: email.subject,
		body: await maily.render(),
	};
};
