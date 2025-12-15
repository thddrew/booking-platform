"use client";

import { isSameDay } from "date-fns";
import { UsersIcon } from "lucide-react";
import type { CalendarEvent } from "@/components/calendar/schemas";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-provider";
import type { EventCardPropsBase } from "./types";

type FormatTimeRange = (start: Date, end: Date) => string;

type EventCardProps = EventCardPropsBase & {
	event: Extract<CalendarEvent, { type: "scheduleInstance" }>;
	formatTimeRange?: FormatTimeRange;
};

const defaultFormatTimeRange: FormatTimeRange = (start: Date, end: Date) => {
	const isSameDayCheck = isSameDay(start, end);
	const hasMinutes = start.getMinutes() !== 0 || end.getMinutes() !== 0;

	const formatter = new Intl.DateTimeFormat("en-US", {
		day: isSameDayCheck ? undefined : "numeric",
		month: isSameDayCheck ? undefined : "2-digit",
		hour: "numeric",
		minute: hasMinutes ? "numeric" : undefined,
	});
	return formatter.formatRange(start, end);
};

export function ScheduleInstanceCard({
	event,
	onClick,
	className,
	isSelected,
	compact = false,
	formatTimeRange = defaultFormatTimeRange,
}: EventCardProps) {
	const { view } = useCalendar();

	// TODO: Get the count of bookings for this schedule instance
	// const [] = usePayloadAPI<number>("/api/bookings/count");

	return (
		<button
			type="button"
			className={cn(
				"rounded w-full text-left flex flex-col cursor-pointer transition-all hover:shadow-sm text-white border bg-card p-1 sm:p-2",
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
					"sticky w-full top-20 flex items-start justify-between truncate gap-0.5 flex-wrap",
					// "@max-[10rem]:flex-col @max-[10rem]:items-start @max-[10rem]:justify-start @max-[10rem]:h-full",
					view === "day" && "top-2",
				)}
			>
				{/* <div
						className={cn(
							"font-medium leading-tight md:line-clamp-2",
							compact && "text-xs",
						)}
					>
						{event.title}
					</div> */}
				<div className={cn("text-muted-foreground", compact && "text-xs")}>
					{formatTimeRange(new Date(event.dtstart), new Date(event.dtend))}
				</div>
				<div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
					<UsersIcon strokeWidth={1.5} className="size-3" />
					<div className={cn(compact && "text-xs")}>
						0 / {event.maxQuantity}
					</div>
				</div>
			</div>
		</button>
	);
}
