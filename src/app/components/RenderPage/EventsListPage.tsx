import { payloadSDK } from "@/lib/payload/payload-sdk";
import { EventsListPageFilters } from "./EventsListPageFilters";
import { eventsListSearchParamsCache } from "./EventsListPageFilters/search-params";
import { eventHasInstancesInRange } from "./EventsListPageFilters/utils/event-has-instances-in-range";
import { validateDateRange } from "./EventsListPageFilters/utils/validate-date-range";

async function EventsListPage({
	tenantId,
	tenantSlug,
}: {
	tenantId: string;
	tenantSlug?: string;
}) {
	// Access cached search params parsed in RenderPage
	const { search, people, startDate, endDate } = eventsListSearchParamsCache.all();

	const { isValid: isValidDateRange, startDate: validatedStartDate, endDate: validatedEndDate } =
		validateDateRange(startDate, endDate);

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

	let events = eventsQuery.docs;

	if (search.trim()) {
		const query = search.toLowerCase().trim();
		events = events.filter((event) => event.title.toLowerCase().includes(query));
	}

	if (people !== null) {
		events = events.filter((event) => (event.maxQuantity ?? 0) >= people);
	}

	if (isValidDateRange && (validatedStartDate || validatedEndDate)) {
		const filterStartDate = validatedStartDate || null;
		const filterEndDate = validatedEndDate || null;

		events = events.filter((event) =>
			eventHasInstancesInRange(event, filterStartDate, filterEndDate),
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[1760px]">
				<EventsListPageFilters events={events} tenantSlug={tenantSlug} />
			</div>
		</div>
	);
}

export { EventsListPage };
