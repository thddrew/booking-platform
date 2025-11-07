"use client";

import type { CalendarEvent } from "@/components/calendar/schemas";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { EventCard } from "./event-card";

interface GroupedEventsDialogProps {
	events: CalendarEvent[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onEventClick?: (event: CalendarEvent) => void;
}

export function GroupedEventsDialog({
	events,
	open,
	onOpenChange,
	onEventClick,
}: GroupedEventsDialogProps) {
	const handleEventClick = (event: CalendarEvent) => {
		onEventClick?.(event);
		onOpenChange(false);
	};


	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{events.length === 1 ? "1 event" : `${events.length} events`}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-2 max-h-[60vh] overflow-y-auto">
					{events.map((event) => (
						<EventCard
							key={`${event.type}-${event.dtstart}-${event.dtend}`}
							event={event}
							onClick={handleEventClick}
							className="w-full"
						/>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}

