"use client";

import type { CalendarEvent } from "@/components/calendar/schemas";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-provider";
import type { EventCardPropsBase } from "./types";

type EventCardProps = EventCardPropsBase & {
	event: Extract<CalendarEvent, { type: "scheduleInstance" }>;
};

export function ScheduleInstanceCard({
	event,
	onClick,
	className,
	isSelected,
	compact = false,
}: EventCardProps) {
	const { view } = useCalendar();
	const formatTimeRange = (start: Date, end: Date) => {
		const formatter = new Intl.DateTimeFormat("en-US", {
			hour: compact ? "2-digit" : "numeric",
			minute: "2-digit",
		});

		return formatter.formatRange(start, end);
	};

	// TODO: Get the count of bookings for this schedule instance
	// const [] = usePayloadAPI<number>("/api/bookings/count");

	return (
		<button
			type="button"
			className={cn(
				"rounded w-full text-left flex flex-col cursor-pointer transition-all hover:shadow-sm text-white border bg-card",
				"p-1 sm:p-2",
				compact && "text-sm p-1 sm:p-1",
				isSelected && "ring-2",
				className,
			)}
			onClick={(e) => {
				e.stopPropagation();
				onClick?.(event);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.stopPropagation();
					onClick?.(event);
				}
			}}
			aria-label={`Event: ${event.title}`}
		>
			<div
				className={cn(
					"sticky top-16 w-full",
					view === "day" && "top-2",
					view === "week" && "top-2",
					view === "three-day" && "top-2",
				)}
			>
				<div
					className={cn(
						"font-medium leading-tight md:line-clamp-2",
						compact && "text-xs",
					)}
				>
					{event.title}
				</div>
				<div className={cn("text-muted-foreground mt-1", compact && "text-xs")}>
					{formatTimeRange(new Date(event.dtstart), new Date(event.dtend))}
				</div>
				<div className={cn("text-muted-foreground mt-1", compact && "text-xs")}>
					0 / {event.maxQuantity}
				</div>
			</div>
		</button>
	);
}
