"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/lib/utils";
import { EventCard } from "./event-card";

interface WeekViewProps {
  dates: Date[];
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onCreateBooking?: (date: Date, hour: number) => void;
}

export function WeekView({
  dates,
  events,
  onEventClick,
  onTimeSlotClick,
  onCreateBooking,
}: WeekViewProps) {
  const today = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentHour = today.getHours();

  useEffect(() => {
    if (scrollContainerRef.current) {
      const hourHeight = 64;
      const scrollPosition = Math.max(0, (currentHour - 2) * hourHeight);

      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [currentHour]);

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const targetDate = new Date(date);

      targetDate.setHours(0, 0, 0, 0);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);

      return targetDate >= eventStart && targetDate <= eventEnd;
    });
  };

  const formatHour = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  const isPastTimeSlot = (date: Date, hour: number) => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < today;
  };

  const getPositionedEventsForDate = (date: Date) => {
    const positionedEvents: Array<{
      event: CalendarEvent;
      top: number;
      height: number;
    }> = [];

    events.forEach((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const eventDate = new Date(eventStart);
      eventDate.setHours(0, 0, 0, 0);

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      if (eventDate.getTime() !== targetDate.getTime()) return;

      const startHour = eventStart.getHours();
      const startMinute = eventStart.getMinutes();
      const endHour = eventEnd.getHours();
      const endMinute = eventEnd.getMinutes();

      const hourHeight = 64; // 4rem = 64px
      const top = startHour * hourHeight + (startMinute / 60) * hourHeight;
      const duration = endHour - startHour + (endMinute - startMinute) / 60;
      const height = duration * hourHeight;

      positionedEvents.push({
        event,
        top,
        height,
      });
    });

    return positionedEvents;
  };

  const hasEventsInHour = (date: Date, hour: number) => {
    return events.some((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const eventDate = new Date(eventStart);
      eventDate.setHours(0, 0, 0, 0);

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      if (eventDate.getTime() !== targetDate.getTime()) return false;

      const startHour = eventStart.getHours();
      const endHour = eventEnd.getHours();

      return hour >= startHour && hour < endHour;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b bg-muted/50">
        <div className="p-3 border-r"></div>
        {dates.map((date, index) => {
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div
              key={date.toISOString()}
              className={cn(
                "p-3 text-center border-r",
                isToday && "bg-primary/10"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mt-1",
                  isToday &&
                    "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                )}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div
        className="flex-1 overflow-auto"
        ref={scrollContainerRef}
      >
        <div className="grid grid-cols-8">
          {/* Time column */}
          <div className="border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b p-2 text-xs text-muted-foreground text-right"
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dates.map((date, dateIndex) => {
            const isToday = date.toDateString() === today.toDateString();
            const positionedEvents = getPositionedEventsForDate(date);

            return (
              <div
                key={date.toISOString()}
                className="border-r relative"
              >
                {positionedEvents.map(({ event, top, height }) => (
                  <div
                    key={event.id}
                    className="absolute left-1 right-1 z-10"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <EventCard
                      event={event}
                      onClick={onEventClick}
                      compact
                      className="h-full"
                    />
                  </div>
                ))}

                {hours.map((hour) => {
                  const isPast = isPastTimeSlot(date, hour);
                  const hasEvents = hasEventsInHour(date, hour);

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "h-16 border-b p-1 cursor-pointer hover:bg-muted/50 transition-colors relative group",
                        isToday && "bg-primary/5",
                        isPast &&
                          "bg-gray-100 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)] cursor-not-allowed opacity-60"
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
                          className="absolute bottom-1 right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-primary/90 z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateBooking?.(date, hour);
                          }}
                          aria-label="Create new booking"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
