import { workflow } from "@novu/framework";
import { workflowPayloadSchema } from "./schemas";

export const newBookingWorkflowId = "new-booking";

export const getNewBookingWorkflow = () =>
  workflow(
    newBookingWorkflowId,
    async ({ step, payload }) => {
      await step.email("send-email", async () => {
        return {
          subject: payload.subject,
          body: payload.body,
        };
      });
    },
    {
      payloadSchema: workflowPayloadSchema,
    }
  );
