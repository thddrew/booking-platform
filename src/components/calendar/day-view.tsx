"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/lib/utils";
import { useCalendar } from "./calendar-provider";
import { EventCard } from "./event-card";

interface DayViewProps {
  date: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onCreateBooking?: (date: Date, hour: number) => void;
}

export function DayView({
  date,
  onEventClick,
  onTimeSlotClick,
  onCreateBooking,
}: DayViewProps) {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentHour = today.getHours();

  const { events } = useCalendar();

  useEffect(() => {
    if (scrollContainerRef.current) {
      const hourHeight = 80;
      const scrollPosition = Math.max(0, (currentHour - 2) * hourHeight);

      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [currentHour]);

  // const getEventsForHour = (hour: number) => {
  //   return events.filter((event) => {
  //     const eventStart = new Date(event.start);
  //     const eventEnd = new Date(event.end);
  //     const eventDate = new Date(eventStart);
  //     eventDate.setHours(0, 0, 0, 0);

  //     const targetDate = new Date(date);
  //     targetDate.setHours(0, 0, 0, 0);

  //     if (eventDate.getTime() !== targetDate.getTime()) return false;

  //     const startHour = eventStart.getHours();
  //     const endHour = eventEnd.getHours();

  //     return hour >= startHour && hour <= endHour;
  //   });
  // };

  const formatHour = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  const isPastTimeSlot = (hour: number) => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < today;
  };

  const getPositionedEvents = () => {
    const positionedEvents: Array<{
      event: CalendarEvent;
      top: number;
      height: number;
      hour: number;
    }> = [];

    events.forEach((event) => {
      const eventStart = new Date(event.dtstart);
      const eventEnd = new Date(event.dtend);
      const eventDate = new Date(eventStart);
      eventDate.setHours(0, 0, 0, 0);

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      if (eventDate.getTime() !== targetDate.getTime()) return;

      const startHour = eventStart.getHours();
      const startMinute = eventStart.getMinutes();
      const endHour = eventEnd.getHours();
      const endMinute = eventEnd.getMinutes();

      const hourHeight = 80; // 5rem = 80px
      const top = startHour * hourHeight + (startMinute / 60) * hourHeight;
      const duration = endHour - startHour + (endMinute - startMinute) / 60;
      const height = duration * hourHeight;

      positionedEvents.push({
        event,
        top,
        height,
        hour: startHour,
      });
    });

    return positionedEvents;
  };

  const hasEventsInHour = (hour: number) => {
    return events.some((event) => {
      const eventStart = new Date(event.dtstart);
      const eventEnd = new Date(event.dtend);
      const eventDate = new Date(eventStart);
      eventDate.setHours(0, 0, 0, 0);

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      if (eventDate.getTime() !== targetDate.getTime()) return false;

      const startHour = new Date(eventStart).getHours();
      const endHour = new Date(eventEnd).getHours();

      return hour >= startHour && hour < endHour;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}

      {/* Time slots */}
      <div
        className="flex-1 overflow-auto overscroll-contain max-h-[400px]"
        ref={scrollContainerRef}
      >
        <div className="grid grid-cols-[100px_repeat(11,1fr)] gap-0">
          {/* Time column */}
          <div className="col-span-1 border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-20 border-b p-3 text-sm text-muted-foreground text-right"
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="col-span-11 relative">
            {getPositionedEvents().map(({ event, top, height }) => (
              <div
                key={`${event.type}-${event.dtstart.toISOString()}-${event.dtend.toISOString()}`}
                className="absolute left-2 right-2 z-10"
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <EventCard
                  event={event}
                  onClick={onEventClick}
                  className="h-full"
                />
              </div>
            ))}

            {hours.map((hour) => {
              const isPast = isPastTimeSlot(hour);
              const hasEvents = hasEventsInHour(hour);

              return (
                <div
                  key={hour}
                  className={cn(
                    "h-20 border-b p-2 cursor-pointer hover:bg-muted/50 transition-colors relative group",
                    isToday && "bg-primary/5",
                    isPast &&
                      "bg-gray-100 hover:bg-gray-100 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)] cursor-not-allowed opacity-60"
                  )}
                  onClick={() =>
                    !isPast && !hasEvents && onTimeSlotClick?.(date, hour)
                  }
                  role="button"
                  tabIndex={isPast ? -1 : 0}
                  onKeyDown={(e) => {
                    if (
                      !isPast &&
                      !hasEvents &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      onTimeSlotClick?.(date, hour);
                    }
                  }}
                  aria-label={`${date.toLocaleDateString()} at ${formatHour(hour)}`}
                >
                  {!isPast && !hasEvents && (
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-primary/90 z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateBooking?.(date, hour);
                      }}
                      aria-label="Create new booking"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
