"use server";

import type { CollectionAfterChangeHook } from "payload";
import { BOOKING_CONFIRMATION } from "@/collections/Emails/utils/email-types";
import type { Booking } from "@/payload-types";
import { triggerWorkflow } from "../utils/trigger-workflow";

export const newBookingEmail: CollectionAfterChangeHook<Booking> = async ({
  operation,
  context,
  doc,
}) => {
  const isNewBooking =
    operation === "create" && doc.paymentMethod === "payLater";

  const isPaymentSessionCompleted =
    operation === "update" &&
    doc.paymentMethod === "payNow" &&
    context?.isStripePaid;

  if (isNewBooking || isPaymentSessionCompleted) {
    await triggerWorkflow({
      booking: doc,
      emailType: BOOKING_CONFIRMATION,
    });
  }
};
