import Link from "next/link";
import { payloadSDK } from "@/lib/payload/payload-sdk";

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
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
						{events.map((event) => {
							const minPrice = event.prices && event.prices.length > 0
								? Math.min(...event.prices.map((p) => p.amount))
								: null;
							const isFree = minPrice === 0 || minPrice === null;
							const hasMultiplePrices = event.prices && event.prices.length > 1;

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
										<div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-muted mb-3">
											{event.thumbnail &&
												typeof event.thumbnail === "object" &&
												"url" in event.thumbnail &&
												event.thumbnail.url && (
													<img
														src={event.thumbnail.url}
														alt={event.title}
														className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
													/>
												)}
										</div>

										<div className="flex flex-col gap-1">
											<div className="flex items-start justify-between gap-2">
												<h3 className="font-semibold text-[15px] text-foreground line-clamp-2 flex-1 leading-tight">
													{event.title}
												</h3>
												{minPrice !== null && !isFree && (
													<div className="flex items-baseline gap-1 shrink-0">
														<span className="font-semibold text-[15px]">
															${minPrice.toFixed(0)}
														</span>
														{hasMultiplePrices && (
															<span className="text-xs text-muted-foreground">
																+
															</span>
														)}
													</div>
												)}
											</div>

											{isFree && (
												<div className="flex items-center gap-1">
													<span className="font-semibold text-[15px] text-foreground">
														Free
													</span>
												</div>
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
