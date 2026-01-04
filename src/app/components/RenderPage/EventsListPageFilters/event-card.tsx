"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Event } from "@/payload-types";
import { formatShortDate, formatTime } from "./utils/format-date";
import { getNextAvailableSlots } from "./utils/get-next-available-slots";

interface EventCardProps {
	event: Event;
	tenantSlug?: string;
	dateRangeStart: Date | null;
	dateRangeEnd: Date | null;
}

export function EventCard({
	event,
	tenantSlug,
	dateRangeStart,
	dateRangeEnd,
}: EventCardProps) {
	const activePrices = event.prices?.filter((p) => p.isActive !== false) || [];
	const minPrice = activePrices.length > 0
		? Math.min(...activePrices.map((p) => p.amount))
		: null;
	const isFree = minPrice === 0 || minPrice === null;

	const baseHref = tenantSlug
		? `/tenant-slugs/${tenantSlug}/events/${event.slug || event.id}`
		: `./${event.slug || event.id}`;

	const availableSlots = getNextAvailableSlots(event, dateRangeStart, dateRangeEnd);

	return (
		<div className="block group">
			<div className="flex flex-col">
				<Link href={baseHref}>
					<div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted mb-2">
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
				</Link>

				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between gap-2">
						<Link href={baseHref} className="flex-1 min-w-0">
							<h3 className="font-semibold text-[16px] text-foreground line-clamp-1 leading-tight group-hover:underline">
								{event.title}
							</h3>
						</Link>
						{!isFree && minPrice !== null ? (
							<div className="text-[14px] text-foreground shrink-0">
								<span className="font-medium">${minPrice.toFixed(0)}</span>
								{activePrices.length > 1 && (
									<span className="text-muted-foreground ml-1">+</span>
								)}
							</div>
						) : (
							<span className="text-[14px] text-foreground shrink-0">Free</span>
						)}
					</div>
					{availableSlots.length > 0 && (
						<div className="my-1">
							<div className="text-xs font-medium text-muted-foreground mb-1">
								Upcoming times
							</div>
							<div className="flex flex-wrap gap-2">
								{availableSlots.map((slot) => {
									const href = `${baseHref}?dtstart=${encodeURIComponent(slot.dtstart.toISOString())}&dtend=${encodeURIComponent(slot.dtend.toISOString())}`;
									return (
										<Link key={`${slot.dtstart.toISOString()}-${slot.dtend.toISOString()}`} href={href}>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="text-[12px] h-auto py-1 px-2"
											>
												{formatShortDate(slot.dtstart)} at {formatTime(slot.dtstart)}
											</Button>
										</Link>
									);
								})}
							</div>
						</div>
					)}
					{event.maxQuantity && (
						<span className="text-[12px] text-muted-foreground">
							Up to {event.maxQuantity} people
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
