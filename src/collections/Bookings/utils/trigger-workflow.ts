"use server";

import { CustomerSchema } from "@/collections/Customers/utils/schemas";
import type {
  BOOKING_CANCELLED,
  BOOKING_CONFIRMATION,
  BOOKING_UPDATED,
} from "@/collections/Emails/utils/email-types";
import { renderBookingEmail } from "@/collections/Emails/utils/render-emails";
import { createSubscriberId } from "@/lib/novu/create-subscriber-id";
import { bookingEmailWorkflow } from "@/lib/novu/workflow/booking-email-workflow";
import type { Booking } from "@/payload-types";
import { extractID } from "@/utilities/extractID";

export const triggerWorkflow = async ({
  booking,
  emailType,
}: {
  booking: Booking;
  emailType:
    | typeof BOOKING_CONFIRMATION
    | typeof BOOKING_CANCELLED
    | typeof BOOKING_UPDATED;
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
    customer.data.id
  );

  const workflowPayload = await renderBookingEmail(emailType, {
    booking,
    customer: customer.data,
  });

  return await bookingEmailWorkflow.trigger({
    to: {
      subscriberId,
    },
    payload: workflowPayload,
  });
};
