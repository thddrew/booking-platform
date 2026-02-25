"use server";

import configPromise from "@payload-config";
import { getPayload } from "payload";
import { renderEmail } from "@/collections/Emails/utils/render-emails";
import { createSubscriberId } from "@/lib/novu/create-subscriber-id";
import { emailWorkflow } from "@/lib/novu/workflow/email-workflow";
import { extractID } from "@/utilities/extractID";

interface SendCampaignEmailResult {
	success: boolean;
	sent: number;
	failed: number;
	error?: string;
}

export async function sendCampaignEmail(
	campaignId: string,
	emailId: string,
	tenantId: string,
): Promise<SendCampaignEmailResult> {
	try {
		const payload = await getPayload({ config: configPromise });

		const campaign = await payload.findByID({
			collection: "campaigns",
			id: campaignId,
			overrideAccess: true,
		});

		if (!campaign) {
			return {
				success: false,
				sent: 0,
				failed: 0,
				error: "Campaign not found",
			};
		}

		const email = await payload.findByID({
			collection: "emails",
			id: emailId,
			overrideAccess: true,
			draft: true,
		});

		if (!email) {
			return {
				success: false,
				sent: 0,
				failed: 0,
				error: "Email template not found",
			};
		}

		const subscribers = campaign.subscribers || [];
		if (subscribers.length === 0) {
			return {
				success: false,
				sent: 0,
				failed: 0,
				error: "No subscribers in campaign",
			};
		}

		const renderedEmail = await renderEmail({
			email,
			context: {},
		});

		let sent = 0;
		let failed = 0;

		for (const subscriber of subscribers) {
			try {
				const customerId = extractID(subscriber);
				if (!customerId) {
					failed++;
					continue;
				}

				const subscriberId = createSubscriberId(tenantId, customerId);

				await emailWorkflow.trigger({
					to: { subscriberId },
					payload: renderedEmail,
				});

				sent++;
			} catch (err) {
				console.error("Failed to send to subscriber:", err);
				failed++;
			}
		}

		return { success: true, sent, failed };
	} catch (err) {
		console.error("Failed to send campaign email:", err);
		return {
			success: false,
			sent: 0,
			failed: 0,
			error:
				err instanceof Error ? err.message : "Failed to send campaign email",
		};
	}
}
