import configPromise from "@payload-config";
import { getTenantFromCookie } from "@payloadcms/plugin-multi-tenant/utilities";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

export async function GET() {
	try {
		const headersList = await getHeaders();
		const payload = await getPayload({ config: configPromise });
		const { user } = await payload.auth({ headers: headersList });

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const tenantId = getTenantFromCookie(headersList, "text") as string | null;
		if (!tenantId) {
			return NextResponse.json(
				{ error: "No tenant selected" },
				{ status: 400 },
			);
		}

		const tenant = await payload.findByID({
			collection: "tenants",
			id: tenantId,
			overrideAccess: true,
		});

		const events = await payload.find({
			collection: "events",
			where: {
				and: [
					{ tenant: { equals: tenantId } },
					{ _status: { equals: "published" } },
				],
			},
			limit: 1,
			overrideAccess: true,
		});

		const connectedAccounts = await payload.find({
			collection: "connectedAccounts",
			where: {
				and: [{ tenant: { equals: tenantId } }, { default: { equals: true } }],
			},
			limit: 1,
			overrideAccess: true,
		});

		const steps = {
			accountCreated: true,
			eventCreated: events.totalDocs > 0,
			paymentsSetup: connectedAccounts.totalDocs > 0,
			pageShared: false, // We can't really track this — it's a manual action
		};

		const completed = Object.values(steps).filter(Boolean).length;
		const total = Object.keys(steps).length;
		const isComplete = completed >= 3; // Account + event + payments = ready to go

		return NextResponse.json({
			steps,
			completed,
			total,
			isComplete,
			tenant: {
				slug: tenant?.slug,
				name: tenant?.name,
			},
		});
	} catch (err) {
		console.error("Onboarding status error:", err);
		return NextResponse.json(
			{ error: "Failed to get onboarding status" },
			{ status: 500 },
		);
	}
}
