import type { CollectionAfterChangeHook } from "payload";
import { CustomerSchema } from "@/collections/Customers/utils/schemas";
import {
  BOOKING_CONFIRMATION,
  BOOKING_UPDATED,
} from "@/collections/Emails/utils/email-types";
import { renderBookingEmail } from "@/collections/Emails/utils/render-emails";
import { createSubscriberId } from "@/lib/novu/create-subscriber-id";
import { bookingEmailWorkflow } from "@/lib/novu/workflow/booking-email-workflow";
import type { Booking } from "@/payload-types";
import { extractID } from "@/utilities/extractID";

export const updateBookingEmail: CollectionAfterChangeHook<Booking> = async ({
  operation,
  context,
  doc,
}) => {
  if (!context?.triggerAfterChange) return;

  // if (operation === "update" && context?.isStripePaid) {
  //   await triggerWorkflow();
  // }

  // TODO: handle sending email when booking information is updated
};
