import { RRuleTemporal } from "rrule-temporal";
import type { Temporal } from "temporal-polyfill";
import type { CalendarEvent } from "@/components/calendar/types";
import type { getEventDuration } from "@/lib/get-event-duration";

type ScheduleInstance = Extract<CalendarEvent, { type: "scheduleInstance" }>;

/**
 * Expands a schedule into individual occurrences for a given date range.
 */
export function expandSchedule({
  rruleString,
  scheduleId,
  eventName,
  eventDuration,
  viewStart,
  viewEnd,
}: {
  /** The rrule string to expand. */
  rruleString: string;
  /** The id of the schedule. */
  scheduleId: string;
  /** The name of the schedule. */
  eventName?: string;
  /** The duration of the event. See {@link getEventDuration}. */
  eventDuration: Temporal.Duration;
  /** The start date of the view range. */
  viewStart: Date;
  /** The end date of the view range. */
  viewEnd: Date;
}): ScheduleInstance[] {
  let expandedInstances: ScheduleInstance[] = [];
  const rule = new RRuleTemporal({ rruleString });

  const allInstances = rule.between(viewStart, viewEnd, true);

  for (const instance of allInstances) {
    expandedInstances = [
      ...expandedInstances,
      {
        type: "scheduleInstance",
        scheduleId,
        title: eventName,
        dtstart: new Date(instance.epochMilliseconds),
        dtend: new Date(instance.add(eventDuration).epochMilliseconds),
      },
    ];
  }

  return expandedInstances;
}
