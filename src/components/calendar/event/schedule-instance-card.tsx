"use client";

import type { Where } from "payload";
import type { CalendarEvent } from "@/components/calendar/schemas";
import { usePayloadAPI } from "@/hooks/use-payload-api";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-provider";
import type { EventCardPropsBase } from "./types";

type EventCardProps = EventCardPropsBase & {
  event: Extract<CalendarEvent, { type: "scheduleInstance" }>;
};

const mapAvailabilityToColor = (eventRatio: number) => {
  if (eventRatio === 1) return "#dc2626"; // No space left, red-600
  if (eventRatio >= 0.8) return "#ea580c"; // 80% full, orange-600
  if (eventRatio >= 0.5) return "#0f766e"; // 50% full, teal-600
  return "#059669"; // At least 50% space left, emerald-600
};

export function ScheduleInstanceCard({
  event,
  onClick,
  className,
  isSelected,
  compact = false,
}: EventCardProps) {
  const { view } = useCalendar();
  const formatTimeRange = (start: Date, end: Date) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: compact ? "2-digit" : "numeric",
      minute: "2-digit",
    });

    return formatter.formatRange(start, end);
  };

  // TODO: Get the count of bookings for this schedule instance
  // const [] = usePayloadAPI<number>("/api/bookings/count");

  return (
    <button
      type="button"
      className={cn(
        "rounded w-full text-left flex flex-col cursor-pointer transition-all hover:shadow-sm text-white border bg-card",
        "p-1 sm:p-2",
        compact && "text-sm p-1 sm:p-1",
        isSelected && "ring-2",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(event);
        }
      }}
      aria-label={`Event: ${event.title}`}
    >
      <div className={cn("sticky top-20 w-full", view === "day" && "top-4")}>
        <div
          className={cn(
            "font-medium leading-tight md:line-clamp-2",
            compact && "text-xs"
          )}
        >
          {event.title}
        </div>
        <div className={cn("text-muted-foreground mt-1", compact && "text-xs")}>
          {formatTimeRange(new Date(event.dtstart), new Date(event.dtend))}
        </div>
        <div className={cn("text-muted-foreground mt-1", compact && "text-xs")}>
          0 / {event.maxQuantity}
        </div>
      </div>
    </button>
  );
}
