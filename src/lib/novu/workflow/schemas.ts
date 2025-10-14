import { z } from "zod/v3";

export const workflowPayloadSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export type WorkflowPayload = z.infer<typeof workflowPayloadSchema>;
