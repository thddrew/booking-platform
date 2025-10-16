import type { CollectionAfterChangeHook } from "payload";
import { CustomerSchema } from "@/collections/Customers/utils/schemas";
import { BOOKING_CONFIRMATION } from "@/collections/Emails/utils/email-types";
import { renderBookingEmail } from "@/collections/Emails/utils/render-emails";
import { createSubscriberId } from "@/lib/novu/create-subscriber-id";
import { getNewBookingWorkflow } from "@/lib/novu/workflow/new-booking-workflow";
import type { Booking } from "@/payload-types";
import { extractID } from "@/utilities/extractID";

export const newBookingEmail: CollectionAfterChangeHook<Booking> = async ({
  operation,
  context,
  doc,
}) => {
  const triggerWorkflow = async () => {
    if (!doc.tenant) {
      throw new Error("Missing tenant");
    }

    const customer = CustomerSchema.safeParse(doc.customerSnapshot);

    if (!customer.success) {
      throw new Error("Invalid customer snapshot", {
        cause: customer.error.message,
      });
    }

    const subscriberId = createSubscriberId(
      extractID(doc.tenant),
      customer.data.id
    );

    const workflowPayload = await renderBookingEmail(BOOKING_CONFIRMATION, {
      booking: doc,
      customer: customer.data,
    });

    const workflow = getNewBookingWorkflow();
    await workflow.trigger({
      to: {
        subscriberId,
      },
      payload: workflowPayload,
    });
  };

  // This should only run when the booking is created and not be triggered by any booking updates
  // payLater means we dont need to wait for the stripe webhook
  if (operation === "create" && doc.paymentMethod === "payLater") {
    await triggerWorkflow();
  }

  // This decouples this hook from the triggerAfterChange context
  // eg. only runs when the stripe checkout session is completed and the booking is updated
  if (
    operation === "update" &&
    doc.paymentMethod === "payNow" &&
    context?.isStripePaid
  ) {
    await triggerWorkflow();
  }
};
