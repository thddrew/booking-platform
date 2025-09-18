"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent, CalendarProps } from "@/components/calendar/types";
import { useCalendar } from "@/hooks/use-calendar";
import { expandRecurringEvents } from "@/lib/event-utils";
import { cn } from "@/lib/utils";
import { BookingDetailsDialog } from "./booking-details-dialog";
import { CalendarHeader } from "./calendar-header";
import { DayView } from "./day-view";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";

export function Calendar({
  events = [],
  view: initialView = "week",
  date: initialDate = new Date(),
  onViewChange,
  onDateChange,
  onEventClick,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  className,
}: CalendarProps) {
  const {
    currentDate,
    view,
    setView,
    setCurrentDate,
    navigateDate,
    goToToday,
    getViewDates,
  } = useCalendar(initialDate, initialView);

  const [selectedBooking, setSelectedBooking] = useState<CalendarEvent | null>(
    null
  );
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createBookingSlot, setCreateBookingSlot] = useState<{
    date: Date;
    hour?: number;
  } | null>(null);

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    onViewChange?.(newView);
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedBooking(event);
    setIsBookingDialogOpen(true);
    onEventClick?.(event);
  };

  const handleDateClick = (date: Date) => {
    if (view === "month") {
      setView("day");
      handleDateChange(date);
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    // For surfing bookings, we might want to handle this differently
    // For now, just switch to day view
    if (view !== "day") {
      setView("day");
      handleDateChange(date);
    }
  };

  const handleCreateBooking = (date: Date, hour?: number) => {
    setCreateBookingSlot({ date, hour });
    setIsCreateDialogOpen(true);
  };

  const viewDates = getViewDates;

  const expandedEvents = useMemo(() => {
    if (!viewDates.length) return [];
    const viewStart = viewDates[0];
    const viewEnd = new Date(viewDates[viewDates.length - 1]);
    viewEnd.setHours(23, 59, 59, 999); // Ensure the viewEnd includes the entire last day

    return expandRecurringEvents(events, viewStart, viewEnd);
  }, [events, viewDates]);

  const renderView = () => {
    switch (view) {
      case "month":
        return (
          <MonthView
            dates={viewDates}
            currentDate={currentDate}
            events={expandedEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onCreateBooking={handleCreateBooking}
          />
        );
      case "week":
        return (
          <WeekView
            dates={viewDates}
            events={expandedEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onCreateBooking={handleCreateBooking}
          />
        );
      case "day":
        return (
          <DayView
            date={currentDate}
            events={expandedEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onCreateBooking={handleCreateBooking}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border rounded-lg overflow-hidden",
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

      <BookingDetailsDialog
        booking={selectedBooking}
        isOpen={isBookingDialogOpen}
        onOpenChange={() => {
          setIsBookingDialogOpen(false);
          setSelectedBooking(null);
        }}
      />

      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Create New Booking</h2>
            <p>Date: {createBookingSlot?.date.toLocaleDateString()}</p>
            {createBookingSlot?.hour !== undefined && (
              <p>Time: {createBookingSlot.hour}:00</p>
            )}
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-primary text-white rounded"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
