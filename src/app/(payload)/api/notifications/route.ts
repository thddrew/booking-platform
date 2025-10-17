import { serve } from "@novu/framework/next";
import { bookingEmailWorkflow } from "@/lib/novu/workflow/booking-email-workflow";

export const { GET, OPTIONS, POST } = serve({
  workflows: [bookingEmailWorkflow],
});
