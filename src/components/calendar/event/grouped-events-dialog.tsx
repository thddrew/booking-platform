"use client";

import type { CalendarEvent } from "@/components/calendar/schemas";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { shallowEqual } from "../utils/shallow-equal";
import { EventCard } from "./event-card";

interface GroupedEventsDialogProps {
	events: CalendarEvent[];
	selectedEvent?: CalendarEvent;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onEventClick?: (event: CalendarEvent) => void;
}

export function GroupedEventsDialog({
	events,
	selectedEvent,
	open,
	onOpenChange,
	onEventClick,
}: GroupedEventsDialogProps) {
	const handleEventClick = (event: CalendarEvent) => {
		onEventClick?.(event);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{events.length === 1 ? "1 event" : `${events.length} events`}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-2 max-h-[60vh] overflow-y-auto px-1">
					{events.map((event) => (
						<EventCard
							key={`${event.type}-${event.dtstart}-${event.dtend}`}
							event={event}
							onClick={handleEventClick}
							className="w-full px-3 py-2"
							isSelected={shallowEqual(event, selectedEvent)}
						/>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
