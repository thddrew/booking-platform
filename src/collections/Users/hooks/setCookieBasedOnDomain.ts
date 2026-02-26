import type { CollectionAfterLoginHook } from "payload";

import { generateCookie, getCookieExpiration, mergeHeaders } from "payload";

function setTenantCookie(req: Parameters<CollectionAfterLoginHook>[0]["req"], tenantId: string) {
	const tenantCookie = generateCookie({
		name: "payload-tenant",
		expires: getCookieExpiration({ seconds: 7200 }),
		path: "/",
		returnCookieAsObject: false,
		value: String(tenantId),
	});

	const newHeaders = new Headers({
		"Set-Cookie": tenantCookie as string,
	});

	req.responseHeaders = req.responseHeaders
		? mergeHeaders(req.responseHeaders, newHeaders)
		: newHeaders;
}

export const setCookieBasedOnDomain: CollectionAfterLoginHook = async ({
	req,
	user,
}) => {
	// First, try domain-based tenant matching
	const relatedOrg = await req.payload.find({
		collection: "tenants",
		depth: 0,
		limit: 1,
		where: {
			domain: {
				equals: req.headers.get("host"),
			},
		},
	});

	if (relatedOrg && relatedOrg.docs.length > 0) {
		setTenantCookie(req, relatedOrg.docs[0].id);
		return user;
	}

	// Fallback: for non-super-admin users, auto-set the cookie to their first tenant
	const isSuperAdmin = user?.roles?.includes("super-admin");
	if (!isSuperAdmin && user?.tenants && Array.isArray(user.tenants) && user.tenants.length > 0) {
		const firstTenant = user.tenants[0];
		const tenantId = typeof firstTenant.tenant === "string"
			? firstTenant.tenant
			: firstTenant.tenant?.id;
		if (tenantId) {
			setTenantCookie(req, tenantId);
		}
	}

	return user;
};
