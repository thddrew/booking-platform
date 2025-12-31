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

	const headers = await getHeaders();
	const payload = await getPayload({ config: configPromise });
	const { user } = await payload.auth({ headers });

	const slug = params?.slug;
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
				slug: {
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
								slug: {
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
						`/tenant-slugs/${params.tenant}/login?redirect=${encodeURIComponent(
							`/tenant-slugs/${params.tenant}${slug ? `/${slug.join("/")}` : ""}`,
						)}`,
					);
				}
			} else {
				redirect(
					`/tenant-slugs/${params.tenant}/login?redirect=${encodeURIComponent(
						`/tenant-slugs/${params.tenant}${slug ? `/${slug.join("/")}` : ""}`,
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
								slug: {
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
						`/tenant-slugs/${params.tenant}/login?redirect=${encodeURIComponent(
							`/tenant-slugs/${params.tenant}${slug ? `/${slug.join("/")}` : ""}`,
						)}`,
					);
				}
			} catch {
				redirect(
					`/tenant-slugs/${params.tenant}/login?redirect=${encodeURIComponent(
						`/tenant-slugs/${params.tenant}${slug ? `/${slug.join("/")}` : ""}`,
					)}`,
				);
			}
		} else {
			redirect(
				`/tenant-slugs/${params.tenant}/login?redirect=${encodeURIComponent(
					`/tenant-slugs/${params.tenant}${slug ? `/${slug.join("/")}` : ""}`,
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
					{
						isActive: {
							equals: true,
						},
					},
					{
						_status: {
							equals: "published",
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
		return <RenderPage data={null} slug={slugString} tenantId={tenant.id} tenantSlug={params.tenant} />;
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
					"tenant.slug": {
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
