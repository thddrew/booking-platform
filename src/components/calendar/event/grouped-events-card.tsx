"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent } from "@/components/calendar/schemas";
import { cn } from "@/lib/utils";
import { shallowEqual } from "../utils/shallow-equal";
import { GroupedEventsDialog } from "./grouped-events-dialog";

interface GroupedEventsCardProps {
	events: CalendarEvent[];
	selectedEvent?: CalendarEvent;
	onEventClick?: (event: CalendarEvent) => void;
	className?: string;
	compact?: boolean;
	isSelected?: boolean;
}

export function GroupedEventsCard({
	events,
	selectedEvent,
	onEventClick,
	className,
	compact = false,
}: GroupedEventsCardProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const count = events.length;
	const displayText = count === 1 ? "1 event" : `${count} events`;

	const hasSelectedEvent = useMemo(
		() =>
			selectedEvent &&
			events.some((event) => shallowEqual(event, selectedEvent)),
		[selectedEvent, events],
	);

	return (
		<>
			<button
				type="button"
				className={cn(
					"rounded-md text-sm cursor-pointer transition-all hover:shadow-sm w-full",
					"bg-muted text-muted-foreground border border-border",
					compact ? "p-1 text-xs" : "p-2",
					hasSelectedEvent && "ring-2 ring-primary",
					className,
				)}
				onClick={(e) => {
					e.stopPropagation();
					setDialogOpen(true);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						setDialogOpen(true);
					}
				}}
				aria-label={`${displayText} - click to view`}
			>
				<div className="font-medium text-balance leading-tight">
					{displayText}
				</div>
			</button>
			<GroupedEventsDialog
				events={events}
				selectedEvent={selectedEvent}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onEventClick={onEventClick}
			/>
		</>
	);
}
