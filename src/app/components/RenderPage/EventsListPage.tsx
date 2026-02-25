import { payloadSDK } from "@/lib/payload/payload-sdk";
import { EventsListPageFilters } from "./EventsListPageFilters";
import { eventsListSearchParamsCache, parseDate } from "./EventsListPageFilters/search-params";
import { eventHasInstancesInRange } from "./EventsListPageFilters/utils/event-has-instances-in-range";
import { validateDateRange } from "./EventsListPageFilters/utils/validate-date-range";
import { TenantFooter } from "./TenantFooter";
import { TenantHeader } from "./TenantHeader";
import { filterValidPrices } from "./utils/filter-valid-prices";

function toDateOrNull(value: string | Date | null | undefined): Date | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "string") return parseDate(value);
	return value;
}

async function EventsListPage({
	tenantId,
	tenantSlug,
}: {
	tenantId: string;
	tenantSlug?: string;
}) {
	// Access cached search params parsed in RenderPage
	const { search, people, startDate, endDate } = eventsListSearchParamsCache.all();

	// Convert string values to Date | null for validation
	// The parser should already convert them, but TypeScript doesn't know this
	const startDateParsed = toDateOrNull(startDate);
	const endDateParsed = toDateOrNull(endDate);

	const { isValid: isValidDateRange, startDate: validatedStartDate, endDate: validatedEndDate } =
		validateDateRange(startDateParsed, endDateParsed);

	const tenantDoc = await payloadSDK.findByID({ collection: "tenants", id: tenantId });
	const currency = (tenantDoc as any)?.currency || "cad";

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

	let events = eventsQuery.docs.map(filterValidPrices);

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
			<TenantHeader tenantSlug={tenantSlug} />
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[1760px]">
				<EventsListPageFilters events={events} tenantSlug={tenantSlug} currency={currency} />
			</div>
			<TenantFooter tenantSlug={tenantSlug} />
		</div>
	);
}

export { EventsListPage };
