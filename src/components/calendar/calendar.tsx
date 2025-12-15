"use client";

import type {
	CalendarEvent,
	CalendarView,
	ViewConfig,
} from "@/components/calendar/schemas";
import { cn } from "@/lib/utils";
import { CalendarHeader } from "./calendar-header";
import { useCalendar } from "./calendar-provider";
import { DayView } from "./day-view";
import { MonthView } from "./month-view";
import { ThreeDayView } from "./three-day-view";
import { WeekView } from "./week-view";

/**
 * @todo
 * - show loading toast on bottom right of calendar
 * - allow custom events rendering on calendar?
 * - preload events for viewDates +- 1
 * - make components composable
 * - make headless states and hooks
 */

export interface CalendarProps {
	onViewChange?: (view: CalendarView) => void;
	onDateChange?: (date: Date) => void;
	onEventClick?: (event: CalendarEvent) => void;
	onCreateBooking?: (date: Date) => void;
	onTimeSlotClick?: (date: Date, hour: number) => void;
	className?: string;
	eventRenderer?: (event: CalendarEvent) => React.ReactNode;
	config?: {
		[key in CalendarView]?: ViewConfig;
	};
}

export function Calendar({
	onViewChange,
	onDateChange,
	onEventClick,
	onCreateBooking,
	onTimeSlotClick,
	className,
	config,
}: CalendarProps) {
	const {
		currentDate,
		view,
		setView,
		setCurrentDate,
		navigateDate,
		goToToday,
		viewDates,
	} = useCalendar();

	const handleViewChange = (newView: typeof view) => {
		setView(newView);
		onViewChange?.(newView);
	};

	const handleEventClick = (event: CalendarEvent) => {
		onEventClick?.(event);
	};

	const handleDateClick = (date: Date) => {
		setCurrentDate(date);
		onDateChange?.(date);
	};

	const renderView = () => {
		switch (view) {
			case "month":
				return (
					<MonthView
						dates={viewDates}
						currentDate={currentDate}
						onEventClick={handleEventClick}
						onDateClick={handleDateClick}
						onCreateBooking={onCreateBooking}
						config={config?.month}
					/>
				);
			case "week":
				return (
					<WeekView
						dates={viewDates}
						onEventClick={handleEventClick}
						onTimeSlotClick={onTimeSlotClick}
						onCreateBooking={onCreateBooking}
						config={config?.week}
					/>
				);
			case "three-day":
				return (
					<ThreeDayView
						dates={viewDates}
						onEventClick={handleEventClick}
						onTimeSlotClick={onTimeSlotClick}
						onCreateBooking={onCreateBooking}
						config={config?.["three-day"]}
					/>
				);
			case "day":
				return (
					<DayView
						date={currentDate}
						onEventClick={handleEventClick}
						onTimeSlotClick={onTimeSlotClick}
						onCreateBooking={onCreateBooking}
						config={config?.day}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div
			className={cn(
				"flex flex-col h-full bg-background border rounded max-h-[500px] contain-content",
				className,
			)}
		>
			<CalendarHeader
				currentDate={currentDate}
				view={view}
				onViewChange={handleViewChange}
				onNavigate={navigateDate}
				onToday={goToToday}
			/>

			<div className="flex-1 overflow-y-auto overscroll-contain">
				{renderView()}
			</div>
		</div>
	);
}
