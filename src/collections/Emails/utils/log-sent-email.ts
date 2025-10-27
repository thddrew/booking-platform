import config from "@payload-config";
import { getPayload } from "payload";

export const logSentEmail = async ({
	emailId,
	workflowId,
	transactionId,
	createdAt,
	subscriberIds,
	campaignIds,
}: {
	emailId: string;
	workflowId: string;
	transactionId?: string | null;
	createdAt: string;
	subscriberIds?: string[] | null;
	campaignIds?: string[] | null;
}) => {
	const payload = await getPayload({ config });

	const emailTemplate = await payload.findByID({
		collection: "emails",
		id: emailId,
		draft: true,
	});

	if (!emailTemplate) {
		throw new Error("Email template not found");
	}

	await payload.update({
		collection: "emails",
		id: emailId,
		data: {
			pastEmails: [
				...(emailTemplate.pastEmails || []),
				{
					workflowId,
					createdAt,
					transactionId,
					subscriberIds,
					campaigns: campaignIds,
				},
			],
		},
	});
};
