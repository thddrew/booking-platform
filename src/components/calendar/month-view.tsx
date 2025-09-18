"use client";

import { CheckCircle2, Plus } from "lucide-react";
import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/lib/utils";
import { EventCard } from "./event-card";

interface MonthViewProps {
  dates: Date[];
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onCreateBooking?: (date: Date) => void;
}

export function MonthView({
  dates,
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onCreateBooking,
}: MonthViewProps) {
  const today = new Date();
  const currentMonth = currentDate.getMonth();

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const targetDate = new Date(date);

      const eventStartDate = new Date(eventStart);
      const eventEndDate = new Date(eventEnd);
      const targetDateCopy = new Date(targetDate);

      targetDateCopy.setHours(0, 0, 0, 0);
      eventStartDate.setHours(0, 0, 0, 0);
      eventEndDate.setHours(0, 0, 0, 0);

      return targetDateCopy >= eventStartDate && targetDateCopy <= eventEndDate;
    });
  };

  const separateBookings = (dayEvents: CalendarEvent[]) => {
    const now = new Date();
    const activeBookings: CalendarEvent[] = [];
    const completedBookings: CalendarEvent[] = [];

    dayEvents.forEach((event) => {
      const eventEnd = new Date(event.end);
      const isCompleted = eventEnd < now && event.payment?.status === "paid";

      if (isCompleted) {
        completedBookings.push(event);
      } else {
        activeBookings.push(event);
      }
    });

    return { activeBookings, completedBookings };
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
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
      <div className="grid grid-cols-7 flex-1 max-h-[300px] sm:max-h-none overflow-y-auto">
        {dates.map((date) => {
          const dayEvents = getEventsForDate(date);
          const { activeBookings, completedBookings } =
            separateBookings(dayEvents);
          const isToday = date.toDateString() === today.toDateString();
          const isCurrentMonth = date.getMonth() === currentMonth;

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "min-h-20 border-r border-b p-2 cursor-pointer hover:bg-muted/50 transition-colors relative group",
                !isCurrentMonth && "text-muted-foreground bg-muted/20",
                isToday && "bg-primary/5"
              )}
              onClick={() => onDateClick?.(date)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
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
                      "bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs"
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
                  {activeBookings.slice(0, 2).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      compact
                    />
                  ))}
                  {activeBookings.length > 2 && (
                    <div className="text-xs text-foreground/70 px-1 font-medium">
                      +{activeBookings.length - 2}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="absolute bottom-2 right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-primary/90 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateBooking?.(date);
                }}
                aria-label="Create new booking"
                type="button"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
