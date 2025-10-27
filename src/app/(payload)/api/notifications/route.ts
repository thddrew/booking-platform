import { serve } from "@novu/framework/next";
import { emailWorkflow } from "@/lib/novu/workflow/email-workflow";

export const { GET, OPTIONS, POST } = serve({
	workflows: [emailWorkflow],
});
