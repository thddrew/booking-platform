"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  type CalendarEvent,
  defaultViewConfig,
  type ViewConfig,
} from "@/components/calendar/schemas";
import { cn } from "@/lib/utils";
import { useCalendar } from "./calendar-provider";
import { EventCard } from "./event/event-card";
import { shallowEqual } from "./utils/shallow-equal";

interface WeekViewProps {
  dates: Date[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onCreateBooking?: (date: Date, hour: number) => void;
  config?: ViewConfig;
}

export function WeekView({
  dates,
  onEventClick,
  onTimeSlotClick,
  onCreateBooking,
  config = {},
}: WeekViewProps) {
  const { showCreateBtn }: ViewConfig = {
    ...defaultViewConfig,
    ...config,
  };
  const today = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentHour = today.getHours();

  const { events, selectedEvent } = useCalendar();

  useEffect(() => {
    if (scrollContainerRef.current) {
      const hourHeight = 64;
      const scrollPosition = Math.max(0, (currentHour - 2) * hourHeight);

      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [currentHour]);

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

      const hourHeight = 48; // 3rem = 48px // TODO: Make this dynamic
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

  const getCurrentTimePosition = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (!isToday) return null;

    const hourHeight = 48; // Same as in getPositionedEventsForDate
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const top = currentHour * hourHeight + (currentMinute / 60) * hourHeight;

    return top;
  };

  const hasEventsInHour = (date: Date, hour: number) => {
    return events.some((event) => {
      const eventStart = new Date(event.dtstart);
      const eventEnd = new Date(event.dtend);
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
      <div className="grid grid-cols-[75px_repeat(7,1fr)] border-b bg-card sticky top-0 z-20">
        <div className="p-3 border-r"></div>
        {dates.map((date) => {
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
        className="flex-1"
        ref={scrollContainerRef}
      >
        <div className="grid grid-cols-[75px_repeat(7,1fr)]">
          {/* Time column */}
          <div className="border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[48px] border-b p-2 text-xs text-muted-foreground text-right"
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dates.map((date) => {
            const isToday = date.toDateString() === today.toDateString();
            const positionedEvents = getPositionedEventsForDate(date);
            const currentTimePosition = getCurrentTimePosition(date);

            return (
              <div
                key={date.toISOString()}
                className="relative flex flex-col border-r"
              >
                {positionedEvents.map(({ event, top, height }) => (
                  <div
                    key={`${event.type}-${event.dtstart}-${event.dtend}`}
                    className="absolute left-1 right-1 z-10"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <EventCard
                      event={event}
                      onClick={onEventClick}
                      compact
                      className="h-full"
                      isSelected={shallowEqual(event, selectedEvent)}
                    />
                  </div>
                ))}

                {/* Current time line */}
                {currentTimePosition !== null && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: `${currentTimePosition}px` }}
                  >
                    <div className="relative">
                      <div className="h-0.5 bg-red-500 w-full"></div>
                      <div className="absolute -left-2 -top-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                )}

                {hours.map((hour) => {
                  const isPast = isPastTimeSlot(date, hour);
                  const hasEvents = hasEventsInHour(date, hour);

                  return (
                    <div
                      key={hour}
                      className="relative group h-[48px]"
                    >
                      <button
                        type="button"
                        className={cn(
                          "h-full p-1 cursor-pointer transition-colors w-full text-left",
                          isToday && "bg-primary/5",
                          !isPast && "hover:bg-muted/50",
                          isPast &&
                            "bg-gray-100 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)] cursor-not-allowed opacity-60"
                        )}
                        onClick={() =>
                          !isPast && !hasEvents && onTimeSlotClick?.(date, hour)
                        }
                        disabled={isPast}
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
                      />
                      {showCreateBtn && (
                        <button
                          type="button"
                          className="absolute bottom-1 right-1 w-6 h-6 bg-primary/70 text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-primary/100 hover:ring-2 hover:ring-primary/20 z-10"
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
