import { type JSONContent, Maily } from "@thddrew/maily-render";
import { payloadSDK } from "@/lib/payload/payload-sdk";
import type { Booking, Customer } from "@/payload-types";
import { extractID } from "@/utilities/extractID";
import { isTypedObject } from "@/utilities/isTypedObject";
import type {
  BOOKING_CANCELLED,
  BOOKING_CONFIRMATION,
  BOOKING_UPDATED,
} from "./email-types";
import { getVariables, getVariablesData } from "./variables";

/**
 * Generates the email subject and body for a Booking
 */
export const renderBookingEmail = async (
  emailType:
    | typeof BOOKING_CONFIRMATION
    | typeof BOOKING_CANCELLED
    | typeof BOOKING_UPDATED,
  context: {
    booking: Booking;
    customer: Customer;
  }
) => {
  const connectedEmail = context.booking[emailType];
  if (!connectedEmail) throw new Error(`Missing ${emailType} email on booking`);

  const email = await payloadSDK.findByID({
    collection: "emails",
    id: extractID(connectedEmail),
  });
  if (!email) throw new Error(`Missing ${emailType} email`);

  const maily = isTypedObject<JSONContent>(email.emailContent)
    ? new Maily(email.emailContent)
    : null;

  if (!maily) throw new Error(`Invalid ${emailType} email content`);

  maily.setPreviewText(email.preview ?? undefined);

  const variables = getVariables();
  const variablesData = getVariablesData({ variables, context });

  maily.setVariableValues(variablesData);

  return {
    subject: email.subject,
    body: await maily.render(),
  };
};
