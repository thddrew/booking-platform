import configPromise from "@payload-config";
import { headers as getHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import { EventCheckout } from "@/app/components/RenderPage/EventCheckout";

export default async function CheckoutPage({
	params: paramsPromise,
	searchParams: searchParamsPromise,
}: {
	params: Promise<{ tenant: string }>;
	searchParams: Promise<{
		eventId?: string;
		dtstart?: string;
		dtend?: string;
		scheduleId?: string;
	}>;
}) {
	const params = await paramsPromise;
	const searchParams = await searchParamsPromise;

	const headers = await getHeaders();
	const payload = await getPayload({ config: configPromise });
	const { user } = await payload.auth({ headers });

	// Extract booking details from URL params
	const { eventId, dtstart, dtend, scheduleId } = searchParams;

	if (!eventId || !dtstart || !dtend) {
		// Redirect back to events if required params are missing
		redirect(`/tenant-domains/${params.tenant}/events`);
	}

	// Find tenant by domain (allow public access for checkout)
	let tenant: { id: string } | undefined;

	const tenantsQuery = await payload.find({
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

	if (tenantsQuery.docs.length > 0) {
		tenant = tenantsQuery.docs[0];
	} else if (user) {
		// Try authenticated access
		const authTenantsQuery = await payload.find({
			collection: "tenants",
			overrideAccess: false,
			user,
			where: {
				domain: {
					equals: params.tenant,
				},
			},
		});

		if (authTenantsQuery.docs.length > 0) {
			tenant = authTenantsQuery.docs[0];
		}
	}

	if (!tenant) {
		return notFound();
	}

	// Fetch event data
	const eventQuery = await payload.find({
		collection: "events",
		draft: true,
		where: {
			and: [
				{
					id: {
						equals: eventId,
					},
				},
				{
					tenant: {
						equals: tenant.id,
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

	return (
		<EventCheckout
			event={event}
			selectedTimeslot={{
				dtstart: new Date(dtstart),
				dtend: new Date(dtend),
				scheduleId: scheduleId || "",
			}}
			tenantId={tenant.id}
			tenantSlug={params.tenant}
			user={user || undefined}
		/>
	);
}
