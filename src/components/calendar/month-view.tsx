"use client";

import { CheckCircle2, Plus } from "lucide-react";
import {
	type BookingInstance,
	type CalendarEvent,
	CalendarEventTypes,
	defaultViewConfig,
	type ScheduleInstance,
	type ViewConfig,
} from "@/components/calendar/schemas";
import { cn } from "@/lib/utils";
import { useCalendar } from "./calendar-provider";
import { EventCard } from "./event/event-card";
import { GroupedEventsCard } from "./event/grouped-events-card";
import { shallowEqual } from "./utils/shallow-equal";

interface MonthViewProps {
	dates: Date[];
	currentDate: Date;
	onEventClick?: (event: CalendarEvent) => void;
	onDateClick?: (date: Date) => void;
	onCreateBooking?: (date: Date) => void;
	config?: ViewConfig;
}

export function MonthView({
	dates,
	currentDate,
	onEventClick,
	onDateClick,
	onCreateBooking,
	config = {},
}: MonthViewProps) {
	const { showCreateBtn }: ViewConfig = {
		...defaultViewConfig,
		...config,
	};
	const today = new Date();
	const currentMonth = currentDate.getMonth();

	const { events, selectedEvent } = useCalendar();

	const getEventsForDate = (date: Date) => {
		return events.filter((event) => {
			const eventStart = new Date(event.dtstart);
			const eventEnd = new Date(event.dtend);
			const targetDate = new Date(date);

			targetDate.setHours(0, 0, 0, 0);
			eventStart.setHours(0, 0, 0, 0);
			eventEnd.setHours(0, 0, 0, 0);

			return targetDate >= eventStart && targetDate <= eventEnd;
		});
	};

	const isPastDate = (date: Date) => {
		const today = new Date();
		const targetDate = new Date(date);

		// Set both dates to start of day for accurate comparison
		today.setHours(0, 0, 0, 0);
		targetDate.setHours(0, 0, 0, 0);

		return targetDate < today;
	};

	const separateEvents = (dayEvents: CalendarEvent[]) => {
		const _now = new Date();
		const activeBookings: BookingInstance[] = [];
		const completedBookings: BookingInstance[] = [];
		const scheduleInstances: ScheduleInstance[] = [];

		dayEvents.forEach((event) => {
			if (event.type === CalendarEventTypes.scheduleInstance) {
				scheduleInstances.push(event);
				return;
			}

			if (event.type === CalendarEventTypes.booking) {
				// const eventEnd = new Date(event.dtend);
				const isCompleted = false; // TODO: Add completed bookings

				if (isCompleted) {
					completedBookings.push(event);
				} else {
					activeBookings.push(event);
				}
			}
		});

		return { activeBookings, completedBookings, scheduleInstances };
	};

	const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	return (
		<div className="flex flex-col h-full">
			{/* Week day headers */}
			<div className="grid grid-cols-7 border-b bg-card sticky top-0 z-20">
				{weekDays.map((day) => (
					<div
						key={day}
						className="p-3 text-sm font-medium text-center text-muted-foreground"
					>
						{day}
					</div>
				))}
			</div>

			{/* Calendar grid */}
			<div className="grid grid-cols-7 flex-1">
				{dates.map((date) => {
					const dayEvents = getEventsForDate(date);
					const { activeBookings, completedBookings } =
						separateEvents(dayEvents);
					const isToday = date.toDateString() === today.toDateString();
					const isCurrentMonth = date.getMonth() === currentMonth;
					const isPast = isPastDate(date);

					return (
						<div className="w-full relative group" key={date.toISOString()}>
							{/** biome-ignore lint/a11y/useSemanticElements: both the date container and the event card are interactive; we'll keep the event card a button */}
							<div
								role="button"
								className={cn(
									"size-full flex flex-col min-h-28 border-r border-b p-2 cursor-pointer transition-colors relative",
									!isCurrentMonth && "text-muted-foreground bg-muted/20",
									isToday && "bg-primary/5",
									isPast &&
										"bg-gray-100/30 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.02)_4px,rgba(0,0,0,0.02)_8px)] cursor-not-allowed opacity-60 hover:bg-gray-100/30",
									!isPast && "hover:bg-muted/50",
								)}
								onClick={() => !isPast && onDateClick?.(date)}
								tabIndex={isPast ? -1 : 0}
								onKeyDown={(e) => {
									if (!isPast && (e.key === "Enter" || e.key === " ")) {
										e.preventDefault();
										onDateClick?.(date);
									}
								}}
								aria-label={`${date.toLocaleDateString()}, ${activeBookings.length} active events, ${completedBookings.length} completed`}
							>
								<div className="flex justify-between items-start mb-2">
									<span
										className={cn(
											"text-sm font-medium size-6",
											isToday &&
												"bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs",
											isPast && "text-primary font-semibold",
										)}
									>
										{date.getDate()}
									</span>
								</div>

								<div className="space-y-1">
									{/* Mobile view: circles and +more */}
									<div className="sm:hidden space-y-1">
										{completedBookings.length > 0 && (
											<div className="flex items-center space-x-1 text-[10px] font-medium text-foreground/70">
												<CheckCircle2 className="w-3 h-3 text-green-500" />
												<span>{completedBookings.length}</span>
											</div>
										)}
										{activeBookings.length > 0 && (
											<div className="flex items-center space-x-1">
												<span className="w-3 h-3 rounded-full bg-cyan-500 shrink-0"></span>
												{activeBookings.length > 1 && (
													<span className="text-[10px] font-medium text-foreground/70">
														+{activeBookings.length - 1}
													</span>
												)}
											</div>
										)}
									</div>

									{/* Desktop view: event cards */}
									<div className="hidden sm:block space-y-1">
										{dayEvents.slice(0, 2).map((event) => (
											<EventCard
												key={`${event.type}-${event.dtstart}-${event.dtend}`}
												event={event}
												onClick={onEventClick}
												compact
												isSelected={shallowEqual(event, selectedEvent)}
											/>
										))}
										{dayEvents.length > 2 && (
											<GroupedEventsCard
												events={dayEvents}
												onEventClick={onEventClick}
												compact
											/>
										)}
									</div>
								</div>
							</div>
							{showCreateBtn && !isPast && (
								<button
									className={cn(
										"absolute bottom-2 right-2 w-7 h-7 bg-primary/70 text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-primary/100 hover:ring-2 hover:ring-primary/20 z-10",
									)}
									onClick={(e) => {
										e.stopPropagation();
										onCreateBooking?.(date);
									}}
									aria-label="Create new booking"
									type="button"
								>
									<Plus className="w-4 h-4" />
								</button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
