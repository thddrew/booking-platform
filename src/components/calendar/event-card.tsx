"use client";

import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  className?: string;
  compact?: boolean;
}

export function EventCard({
  event,
  onClick,
  className,
  compact = false,
}: EventCardProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEventColor = () => {
    if (event.color) {
      return event.color;
    }

    // Default colors with proper contrast
    const colors = [
      "#0891b2", // cyan-600
      "#7c3aed", // violet-600
      "#dc2626", // red-600
      "#059669", // emerald-600
      "#ea580c", // orange-600
      "#0f766e", // teal-600
    ];

    const hash = event.title.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  const eventColor = getEventColor();

  return (
    <div
      className={cn(
        "rounded-md text-sm cursor-pointer transition-all hover:shadow-sm border-l-4 text-white",
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(event);
        }
      }}
      aria-label={`Event: ${event.title}`}
    >
      <div className="font-medium text-balance leading-tight md:line-clamp-2">
        {event.title}
      </div>
      {!event.allDay && !compact && (
        <div className="text-xs opacity-90 mt-1">
          {formatTime(event.start)} - {formatTime(event.end)}
        </div>
      )}
      {event.description && !compact && (
        <div className="text-xs opacity-80 mt-1 line-clamp-2">
          {event.description}
        </div>
      )}
    </div>
  );
}
