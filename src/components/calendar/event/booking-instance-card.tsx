"use client";

import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/lib/utils";
import type { EventCardPropsBase } from "./types";

type EventCardProps = EventCardPropsBase & {
  event: Extract<CalendarEvent, { type: "booking" }>;
};

const mapAvailabilityToColor = (eventRatio: number) => {
  if (eventRatio === 1) return "#dc2626"; // No space left, red-600
  if (eventRatio >= 0.8) return "#ea580c"; // 80% full, orange-600
  if (eventRatio >= 0.5) return "#0f766e"; // 50% full, teal-600
  return "#059669"; // At least 50% space left, emerald-600
};

export function BookingInstanceCard({
  event,
  onClick,
  className,
  compact = false,
  stickyTitle = true,
}: EventCardProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getEventColor = () => {
    // Default colors with proper contrast
    const colors = [
      "#0891b2", // cyan-600
      "#7c3aed", // violet-600
      "#dc2626", // red-600
      "#059669", // emerald-600
      "#ea580c", // orange-600
      "#0f766e", // teal-600
    ];

    const hash = event.title?.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash ?? 0) % colors.length];
  };

  const eventColor = getEventColor();

  return (
    <button
      type="button"
      className={cn(
        "rounded-md text-sm cursor-pointer transition-all hover:shadow-sm text-white",
        compact ? "p-1 text-xs" : "p-2",
        className
      )}
      style={{
        backgroundColor: eventColor,
        borderColor: eventColor,
      }}
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
      <div className={cn(stickyTitle && "sticky top-20")}>
        <div className="font-medium text-balance leading-tight md:line-clamp-2">
          {event.title}
        </div>
        <div className="text-xs opacity-90 mt-1">
          {formatTime(event.dtstart)} - {formatTime(event.dtend)}
        </div>
      </div>
      {/* {event.description && !compact && (
        <div className="text-xs opacity-80 mt-1 line-clamp-2">
          {event.description}
        </div>
      )} */}
    </button>
  );
}
