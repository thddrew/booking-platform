import configPromise from "@payload-config";
import type { Metadata } from "next";
import { headers as getHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import type { Where } from "payload";
import { getPayload } from "payload";

import { RenderPage } from "../../../../components/RenderPage";
import { eventsListSearchParamsCache } from "../../../../components/RenderPage/EventsListPageFilters/search-params";

export async function generateMetadata({
	params: paramsPromise,
}: {
	params: Promise<{ slug?: string[]; tenant: string }>;
}): Promise<Metadata> {
	const params = await paramsPromise;
	const slug = params?.slug;
	const slugString = slug?.join("/") || "";

	if (!slugString.startsWith("events/") && slugString !== "events") {
		return {
			title: "Event Booking Platform",
		};
	}

	try {
		const payload = await getPayload({ config: configPromise });

		const tenantsQuery = await payload.find({
			collection: "tenants",
			overrideAccess: true,
			where: { slug: { equals: params.tenant } },
			limit: 1,
		});

		const tenant = tenantsQuery.docs[0];
		if (!tenant) return { title: "Event" };

		if (slugString === "events") {
			return {
				title: `Events | ${tenant?.name || ""}`,
				description: `Browse and book events with ${tenant?.name || ""}`,
			};
		}

		const eventSlug = slugString.split("/")[1];
		if (!eventSlug) {
			return { title: "Events" };
		}

		const eventQuery = await payload.find({
			collection: "events",
			overrideAccess: true,
			where: {
				and: [
					{ tenant: { equals: tenant.id } },
					{ slug: { equals: eventSlug } },
					{ _status: { equals: "published" } },
				],
			},
			limit: 1,
		});

		const event = eventQuery.docs[0];
		if (!event) return { title: "Event" };

		const thumbnailUrl =
			event.thumbnail &&
			typeof event.thumbnail === "object" &&
			"url" in event.thumbnail
				? event.thumbnail.url
				: undefined;

		const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_PUBLIC_SERVER_URL || "";
		const eventUrl = `${baseUrl}/tenant-slugs/${params.tenant}/events/${eventSlug}`;

		return {
			title: `${event.title} | ${tenant.name}`,
			description: `Book ${event.title} with ${tenant.name}`,
			openGraph: {
				title: event.title,
				description: `Book ${event.title} with ${tenant.name}`,
				url: eventUrl,
				type: "website",
				...(thumbnailUrl ? { images: [{ url: thumbnailUrl }] } : {}),
			},
			twitter: {
				card: thumbnailUrl ? "summary_large_image" : "summary",
				title: event.title,
				description: `Book ${event.title} with ${tenant.name}`,
				...(thumbnailUrl ? { images: [thumbnailUrl] } : {}),
			},
		};
	} catch {
		return { title: "Event Booking Platform" };
	}
}

export default async function Page({
	params: paramsPromise,
	searchParams,
}: {
	params: Promise<{ slug?: string[]; tenant: string }>;
	searchParams: Promise<SearchParams>;
}) {
	const params = await paramsPromise;

	const headers = await getHeaders();
	const payload = await getPayload({ config: configPromise });
	const { user } = await payload.auth({ headers });

	const slug = params?.slug;
	const slugString = slug?.join("/") || "";
	const isEventsRoute = slugString === "events" || slugString.startsWith("events/");

	let tenant: { id: string } | undefined;

	// Try to get tenant with normal access (requires authentication)
	const tenantsQuery = await payload.find({
		collection: "tenants",
		overrideAccess: false,
		user,
		where: {
			slug: {
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
		// For non-events routes, require authentication
		redirect(
			`/tenant-slugs/${params.tenant}/login?redirect=${encodeURIComponent(
				`/tenant-slugs/${params.tenant}${slug ? `/${slug.join("/")}` : ""}`,
			)}`,
		);
	}

	if (!tenant) {
		return notFound();
	}

	// For events routes, skip Pages query and let RenderPage handle event routing
	if (isEventsRoute) {
		// Parse searchParams to populate the cache for child components
		await eventsListSearchParamsCache.parse(searchParams);
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

	if (!pageData) {
		return notFound();
	}

	return <RenderPage data={pageData} slug={slugString} tenantId={tenant.id} tenantSlug={params.tenant} />;
}
