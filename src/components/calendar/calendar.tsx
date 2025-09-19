"use client";

import type { CalendarEvent, CalendarProps } from "@/components/calendar/types";
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
 */

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

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const handleEventClick = (event: CalendarEvent) => {
    onEventClick?.(event);
  };

  const handleDateClick = (date: Date) => {
    if (view === "month") {
      setView("day");
      handleDateChange(date);
    }
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
          />
        );
      case "three-day":
        return (
          <ThreeDayView
            dates={viewDates}
            onEventClick={handleEventClick}
            onTimeSlotClick={onTimeSlotClick}
            onCreateBooking={onCreateBooking}
          />
        );
      case "day":
        return (
          <DayView
            date={currentDate}
            onEventClick={handleEventClick}
            onTimeSlotClick={onTimeSlotClick}
            onCreateBooking={onCreateBooking}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border rounded",
        className
      )}
    >
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={handleViewChange}
        onNavigate={navigateDate}
        onToday={goToToday}
      />

      <div className="flex-1 overflow-y-auto">{renderView()}</div>
    </div>
  );
}
