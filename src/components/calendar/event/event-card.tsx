"use client";

import { CalendarEventTypes } from "@/components/calendar/types";
import { BookingInstanceCard } from "./booking-instance-card";
import { ScheduleInstanceCard } from "./schedule-instance-card";
import type { EventCardPropsBase } from "./types";

export function EventCard({ event, ...rest }: EventCardPropsBase) {
  if (event.type === CalendarEventTypes.scheduleInstance) {
    return (
      <ScheduleInstanceCard
        event={event}
        {...rest}
      />
    );
  }

  if (event.type === CalendarEventTypes.booking) {
    return (
      <BookingInstanceCard
        event={event}
        {...rest}
      />
    );
  }

  return null;
}
