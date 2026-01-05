import configPromise from "@payload-config";
import { headers as getHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import type { Where } from "payload";
import { getPayload } from "payload";

import { RenderPage } from "../../../../components/RenderPage";

export default async function Page({
	params: paramsPromise,
	searchParams,
}: {
	params: Promise<{ slug?: string[]; tenant: string }>;
	searchParams: Promise<SearchParams>;
}) {
	const params = await paramsPromise;
	let slug: string[] | undefined;
	if (params?.slug) {
		params.slug.splice(0, 1);
		slug = params.slug;
	}

	const headers = await getHeaders();
	const payload = await getPayload({ config: configPromise });
	const { user } = await payload.auth({ headers });

	const slugString = slug?.join("/") || "";
	const isEventsRoute = slugString === "events" || slugString.startsWith("events/");

	let tenant: { id: string } | undefined;

	// Try to get tenant with normal access (requires authentication)
	const tenantsQuery = await payload.find({
		collection: "tenants",
		overrideAccess: false,
		user,
		where: {
			domain: {
				equals: params.tenant,
			},
		},
	});

	if (tenantsQuery.docs.length > 0) {
		tenant = tenantsQuery.docs[0];
	} else if (isEventsRoute) {
		// For events routes, allow public access if allowPublicRead is true
		const publicTenantsQuery = await payload.find({
			collection: "tenants",
			overrideAccess: true,
			where: {
				and: [
					{
						domain: {
							equals: params.tenant,
						},
					},
					{
						allowPublicRead: {
							equals: true,
						},
					},
				],
			},
		});

		if (publicTenantsQuery.docs.length > 0) {
			tenant = publicTenantsQuery.docs[0];
		} else {
			redirect(
				`/tenant-domains/login?redirect=${encodeURIComponent(
					`/tenant-domains${slug ? `/${slug.join("/")}` : ""}`,
				)}`,
			);
		}
	} else {
		// For non-events routes, require authentication
		redirect(
			`/tenant-domains/login?redirect=${encodeURIComponent(
				`/tenant-domains${slug ? `/${slug.join("/")}` : ""}`,
			)}`,
		);
	}

	if (!tenant) {
		return notFound();
	}

	const slugConstraint: Where = slug
		? {
				slug: {
					equals: slug.join("/"),
				},
			}
		: {
				or: [
					{
						slug: {
							equals: "",
						},
					},
					{
						slug: {
							equals: "home",
						},
					},
					{
						slug: {
							exists: false,
						},
					},
				],
			};

	const pageQuery = await payload.find({
		collection: "pages",
		overrideAccess: false,
		user,
		where: {
			and: [
				{
					"tenant.domain": {
						equals: params.tenant,
					},
				},
				slugConstraint,
			],
		},
	});

	const pageData = pageQuery.docs?.[0];

	if (!pageData) {
		return notFound();
	}

	return <RenderPage data={pageData} slug={slugString} tenantId={tenant.id} tenantSlug={params.tenant} searchParams={searchParams} />;
}
