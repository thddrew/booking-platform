"use server";

import config from "@payload-config";
import { waitUntil } from "@vercel/functions";
import { getPayload } from "payload";
import { createSubscriberId } from "@/lib/novu/create-subscriber-id";
import { emailWorkflow } from "@/lib/novu/workflow/email-workflow";
import { logSentEmail } from "../../utils/log-sent-email";
import { renderEmail } from "../../utils/render-emails";

export const sendTestEmail = async ({
	emailTemplateId,
	emailTo,
	tenantId,
}: {
	emailTemplateId: string;
	emailTo: string;
	tenantId?: string | null;
}) => {
	const payload = await getPayload({ config });

	const emailTemplate = await payload.findByID({
		collection: "emails",
		id: emailTemplateId,
		draft: true,
	});

	if (!emailTemplate) {
		throw new Error("Email not found");
	}

	const emailPayload = await renderEmail({
		email: emailTemplate,
		context: { booking: null, customer: null },
	});

	const { data } = await emailWorkflow.trigger({
		to: {
			subscriberId: createSubscriberId(tenantId ?? "", emailTo),
			email: emailTo,
		},
		payload: emailPayload,
	});

	// @ts-expect-error - data type is wrong and there's a nested data object
	const transactionId = data.data?.transactionId;

	waitUntil(
		logSentEmail({
			emailId: emailTemplateId,
			workflowId: emailWorkflow.id,
			transactionId,
			createdAt: new Date().toISOString(),
		}),
	);

	return transactionId;
};
