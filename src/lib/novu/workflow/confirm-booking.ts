import { workflow } from "@novu/framework";
import { z } from "zod";

export const confirmBookingWorkflow = () =>
  workflow(
    "confirm-booking",
    async ({ step, payload }) => {
      await step.email("send-email", async () => {
        return {
          subject: `Booking Confirmed`,
          body: "Your booking has been confirmed",
        };
      });
    },
    {
      payloadSchema: z.object({
        bookingId: z.string(),
      }),
    }
  );
