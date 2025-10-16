import { CustomerSchema } from "@/collections/Customers/utils/schemas";
import { createSubscriberId } from "@/lib/novu/create-subscriber-id";
import { getNewBookingWorkflow } from "@/lib/novu/workflow/new-booking-workflow";
import { Booking } from "@/payload-types";
import { extractID } from "@/utilities/extractID";
import { CollectionAfterChangeHook } from "payload";

export const newBookingEmail: CollectionAfterChangeHook<Booking> = async ({
  data,
  operation,
  context,
  req,
}) => {
  // This should only run when the booking is created and not be triggered by any booking updates
  // payLater means we dont need to wait for the stripe webhook
  if (operation === "create" && data.paymentMethod === "payLater") {
    if (!data.tenant) {
      throw new Error("Missing tenant");
    }

    const customer = CustomerSchema.safeParse(data.customerSnapshot);

    if (!customer.success) {
      throw new Error("Invalid customer snapshot", {
        cause: customer.error.message,
      });
    }

    const subscriberId = createSubscriberId(
      extractID(data.tenant),
      customer.data.id
    );

    const email = data.bookingConfirmationEmail
      ? await req.payload.findByID({
          collection: "emails",
          id: extractID(data.bookingConfirmationEmail),
        })
      : null;

    if (!email) {
      throw new Error("Missing booking confirmation email");
    }

    const workflow = getNewBookingWorkflow();
    await workflow.trigger({
      to: {
        subscriberId,
      },
      payload: {
        subject: email.subject,
        body: "",
      },
    });
  }

  // This decouples this hook from the triggerAfterChange context
  // eg. only runs when the stripe checkout session is completed
  if (context?.isStripePaid) {
    try {
      if (operation === "update" && data.paymentMethod === "payNow") {
        const customer = CustomerSchema.safeParse(data.customerSnapshot);

        if (!customer.success) {
          throw new Error("Invalid customer snapshot", {
            cause: customer.error.message,
          });
        }

        if (!data.tenant) {
          throw new Error("Missing tenant");
        }

        const subscriberId = createSubscriberId(
          extractID(data.tenant),
          customer.data.id
        );

        const workflow = getNewBookingWorkflow();
        // await workflow.trigger({
        //   to: {
        //     subscriberId,
        //   },
        // });
      }
    } catch (err) {}
  }
};
