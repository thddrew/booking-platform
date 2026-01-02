import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { payloadSDK } from "@/lib/payload/payload-sdk";

function getPriceRange(prices: Array<{ amount: number }>): string {
	if (prices.length === 0) return "";
	const maxPrice = Math.max(...prices.map((p) => p.amount));
	if (maxPrice === 0) return "Free";
	if (maxPrice < 25) return "$";
	if (maxPrice < 50) return "$$";
	if (maxPrice < 100) return "$$$";
	return "$$$$";
}

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
				{events.length === 0 ? (
					<div className="text-center py-24">
						<p className="text-xl text-muted-foreground">
							No events available at this time
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{events.map((event) => {
							const activePrices = event.prices?.filter((p) => p.isActive !== false) || [];
							const minPrice = activePrices.length > 0
								? Math.min(...activePrices.map((p) => p.amount))
								: null;
							const isFree = minPrice === 0 || minPrice === null;
							const priceRange = getPriceRange(activePrices);

							const eventHref = tenantSlug
								? `/tenant-slugs/${tenantSlug}/events/${event.slug || event.id}`
								: `./${event.slug || event.id}`;
							return (
								<Link
									key={event.id}
									href={eventHref}
									className="block group"
								>
									<div className="flex flex-col">
										<div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted mb-2">
											{event.thumbnail &&
												typeof event.thumbnail === "object" &&
												"url" in event.thumbnail &&
												event.thumbnail.url && (
													<img
														src={event.thumbnail.url}
														alt={event.title}
														className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
													/>
												)}
										</div>

										<div className="flex flex-col gap-1">
											<h3 className="font-semibold text-[16px] text-foreground line-clamp-1 leading-tight group-hover:underline">
												{event.title}
											</h3>
											<div className="flex items-center gap-2 text-[14px] text-muted-foreground">
												{priceRange && (
													<span className="font-medium">{priceRange}</span>
												)}
												{priceRange && event.schedules?.schedule && event.schedules.schedule.length > 0 && (
													<span>•</span>
												)}
												{event.schedules?.schedule && event.schedules.schedule.length > 0 && (
													<span className="line-clamp-1">
														{event.schedules.schedule[0]?.scheduleName || "Event"}
													</span>
												)}
											</div>
											{!isFree && minPrice !== null && (
												<div className="text-[14px] text-foreground">
													<span className="font-medium">${minPrice.toFixed(0)}</span>
													{activePrices.length > 1 && (
														<span className="text-muted-foreground ml-1">+</span>
													)}
												</div>
											)}
											{isFree && (
												<Badge variant="success" className="text-[14px]">
													Free
												</Badge>
											)}
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

export { EventsListPage };
