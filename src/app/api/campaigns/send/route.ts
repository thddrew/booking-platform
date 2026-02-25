import configPromise from "@payload-config";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import { sendCampaignEmail } from "@/collections/Campaigns/actions/send-campaign-email";

export async function POST(request: Request) {
	try {
		const headersList = await getHeaders();
		const payload = await getPayload({ config: configPromise });
		const { user } = await payload.auth({ headers: headersList });

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { campaignId, emailId, tenantId } = await request.json();

		if (!campaignId || !emailId || !tenantId) {
			return NextResponse.json(
				{ error: "campaignId, emailId, and tenantId are required" },
				{ status: 400 },
			);
		}

		const result = await sendCampaignEmail(campaignId, emailId, tenantId);

		return NextResponse.json(result, {
			status: result.success ? 200 : 400,
		});
	} catch (err) {
		console.error("Campaign send error:", err);
		return NextResponse.json(
			{ error: "Failed to send campaign" },
			{ status: 500 },
		);
	}
}
