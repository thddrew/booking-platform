import { payloadSDK } from "@/lib/payload/payload-sdk";
import { EventsListPageFilters } from "./EventsListPageFilters";

async function EventsListPage({ tenantId, tenantSlug }: { tenantId: string; tenantSlug?: string }) {
	const eventsQuery = await payloadSDK.find({
		collection: "events",
		where: {
			and: [
				{
					tenant: {
						equals: tenantId,
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
		limit: 100,
	});

	const events = eventsQuery.docs;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[1760px]">
				<EventsListPageFilters events={events} tenantSlug={tenantSlug} />
			</div>
		</div>
	);
}

export { EventsListPage };
