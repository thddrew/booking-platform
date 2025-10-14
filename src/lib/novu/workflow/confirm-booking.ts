import { workflow } from "@novu/framework";
import { workflowPayloadSchema } from "./schemas";

export const confirmBookingWorkflowId = "confirm-booking";

/**
 * This likely only needs to be called once when the app initializes or when the workflow is updated.
 */
export const createConfirmBookingWorkflow = () =>
  workflow(
    confirmBookingWorkflowId,
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
