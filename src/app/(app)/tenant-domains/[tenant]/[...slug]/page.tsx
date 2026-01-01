import configPromise from "@payload-config";
import { headers as getHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Where } from "payload";
import { getPayload } from "payload";

import { RenderPage } from "../../../../components/RenderPage";

export default async function Page({
	params: paramsPromise,
}: {
	params: Promise<{ slug?: string[]; tenant: string }>;
}) {
	const params = await paramsPromise;
	let slug: string[] | undefined;
	if (params?.slug) {
		// remove the domain route param
		params.slug.splice(0, 1);
		slug = params.slug;
	}

	const headers = await getHeaders();
	const payload = await getPayload({ config: configPromise });
	const { user } = await payload.auth({ headers });

	const slugString = slug?.join("/") || "";

	const isEventsList = slugString === "events";
	const isEventDetail =
		slugString.startsWith("events/") && slugString.split("/").length === 2;
	const eventSlug: string | null = isEventDetail
		? slugString.split("/")[1]
		: null;

	let tenant: { id: string } | undefined;
	try {
		const tenantsQuery = await payload.find({
			collection: "tenants",
			overrideAccess: isEventsList || isEventDetail ? true : false,
			user,
			where: {
				domain: {
					equals: params.tenant,
				},
			},
		});

		if (tenantsQuery.docs.length === 0) {
			if (isEventsList || isEventDetail) {
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
				redirect(
					`/tenant-domains/login?redirect=${encodeURIComponent(
						`/tenant-domains${slug ? `/${slug.join("/")}` : ""}`,
					)}`,
				);
			}
		} else {
			tenant = tenantsQuery.docs[0];
		}
	} catch (_e) {
		if (isEventsList || isEventDetail) {
			try {
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
			} catch {
				redirect(
					`/tenant-domains/login?redirect=${encodeURIComponent(
						`/tenant-domains${slug ? `/${slug.join("/")}` : ""}`,
					)}`,
				);
			}
		} else {
			redirect(
				`/tenant-domains/login?redirect=${encodeURIComponent(
					`/tenant-domains${slug ? `/${slug.join("/")}` : ""}`,
				)}`,
			);
		}
	}

	if (!tenant) {
		return notFound();
	}

	if (isEventDetail && eventSlug) {
		const eventQuery = await payload.find({
			collection: "events",
			draft: true,
			where: {
				and: [
					{
						tenant: {
							equals: tenant.id,
						},
					},
					{
						slug: {
							equals: eventSlug,
						},
					},
				],
			},
			limit: 1,
		});

		const event = eventQuery.docs[0];
		if (!event) {
			return notFound();
		}

		return <RenderPage data={null} event={event} slug={slugString} />;
	}

	if (isEventsList) {
		return <RenderPage data={null} slug={slugString} tenantId={tenant.id} />;
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

	// The page with the provided slug could not be found
	if (!pageData) {
		return notFound();
	}

	// The page was found, render the page with data
	return <RenderPage data={pageData} />;
}
