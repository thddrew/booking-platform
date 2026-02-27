import configPromise from "@payload-config";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	try {
		const headersList = await getHeaders();
		const payload = await getPayload({ config: configPromise });
		const { user } = await payload.auth({ headers: headersList });

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { tenantId, domain } = await request.json();

		if (!tenantId || !domain) {
			return NextResponse.json(
				{ error: "Tenant ID and domain are required" },
				{ status: 400 },
			);
		}

		const domainResult = await resend.domains.create({ name: domain });

		if (domainResult.error) {
			return NextResponse.json(
				{ error: domainResult.error.message || "Failed to add domain" },
				{ status: 400 },
			);
		}

		const domainData = domainResult.data;

		await payload.update({
			collection: "tenants",
			id: tenantId,
			overrideAccess: true,
			data: {
				emailDomain: domain,
				emailDomainId: domainData?.id || null,
				emailDomainVerified: false,
			},
		});

		return NextResponse.json({
			success: true,
			domainId: domainData?.id,
			records: domainData?.records || [],
		});
	} catch (err) {
		console.error("Domain creation error:", err);
		return NextResponse.json(
			{ error: "Failed to add domain" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	try {
		const headersList = await getHeaders();
		const payload = await getPayload({ config: configPromise });
		const { user } = await payload.auth({ headers: headersList });

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { tenantId } = await request.json();

		if (!tenantId) {
			return NextResponse.json(
				{ error: "Tenant ID is required" },
				{ status: 400 },
			);
		}

		const tenant = await payload.findByID({
			collection: "tenants",
			id: tenantId,
			overrideAccess: true,
		});

		if (!tenant?.emailDomainId) {
			return NextResponse.json(
				{ error: "No domain configured" },
				{ status: 400 },
			);
		}

		const verifyResult = await resend.domains.verify(tenant.emailDomainId);

		if (verifyResult.error) {
			return NextResponse.json(
				{ error: verifyResult.error.message || "Verification failed" },
				{ status: 400 },
			);
		}

		const domainInfo = await resend.domains.get(tenant.emailDomainId);
		const isVerified = domainInfo.data?.status === "verified";

		await payload.update({
			collection: "tenants",
			id: tenantId,
			overrideAccess: true,
			data: {
				emailDomainVerified: isVerified,
			},
		});

		return NextResponse.json({
			success: true,
			verified: isVerified,
			status: domainInfo.data?.status,
			records: domainInfo.data?.records || [],
		});
	} catch (err) {
		console.error("Domain verification error:", err);
		return NextResponse.json(
			{ error: "Failed to verify domain" },
			{ status: 500 },
		);
	}
}

export async function GET(request: Request) {
	try {
		const headersList = await getHeaders();
		const payload = await getPayload({ config: configPromise });
		const { user } = await payload.auth({ headers: headersList });

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const url = new URL(request.url);
		const tenantId = url.searchParams.get("tenantId");

		if (!tenantId) {
			return NextResponse.json(
				{ error: "Tenant ID is required" },
				{ status: 400 },
			);
		}

		const tenant = await payload.findByID({
			collection: "tenants",
			id: tenantId,
			overrideAccess: true,
		});

		if (!tenant?.emailDomainId) {
			return NextResponse.json({
				configured: false,
				domain: null,
				verified: false,
				records: [],
			});
		}

		try {
			const domainInfo = await resend.domains.get(tenant.emailDomainId);
			return NextResponse.json({
				configured: true,
				domain: tenant.emailDomain,
				verified: tenant.emailDomainVerified,
				status: domainInfo.data?.status,
				records: domainInfo.data?.records || [],
			});
		} catch {
			return NextResponse.json({
				configured: true,
				domain: tenant.emailDomain,
				verified: tenant.emailDomainVerified,
				records: [],
			});
		}
	} catch (err) {
		console.error("Domain status error:", err);
		return NextResponse.json(
			{ error: "Failed to get domain status" },
			{ status: 500 },
		);
	}
}
