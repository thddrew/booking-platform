import { createId } from "@paralleldrive/cuid2";
import { RRuleTemporal } from "rrule-temporal";
import { Temporal } from "temporal-polyfill";
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
  eventMaxQuantity,
  eventDuration,
  viewStart,
  viewEnd,
  config,
}: {
  /** The rrule string to expand. */
  rruleString: string;
  /** The id of the schedule. */
  scheduleId: string;
  /** The name of the schedule. */
  eventName?: string;
  /** The duration of the event. See {@link getEventDuration}. */
  eventDuration: Temporal.Duration;
  /** The maximum quantity of the event. */
  eventMaxQuantity: number;
  /** The start date of the view range. */
  viewStart: Date;
  /** The end date of the view range. */
  viewEnd: Date;
  /** The configuration for the expansion rules. */
  config?: {
    /** Whether to include past dates. */
    includePastDates?: boolean;
    /**
     * @default paralleldrive/cuid2 uses createId()
     * A function to generate an id for the instance. */
    generateId?: (instance: Temporal.ZonedDateTime) => string;
  };
}): ScheduleInstance[] {
  // window.Temporal = Temporal;
  const now = Temporal.Now.zonedDateTimeISO().withTimeZone("UTC");

  const { includePastDates, generateId } = {
    includePastDates: false,
    generateId: createId,
    ...config,
  };

  let expandedInstances: ScheduleInstance[] = [];
  const rule = new RRuleTemporal({ rruleString });
  const allInstances = rule.between(viewStart, viewEnd, true);

  for (const instance of allInstances) {
    // Skip past end dates if not including them
    if (!includePastDates) {
      const endDate = instance.add(eventDuration);

      if (endDate.epochMilliseconds < now.epochMilliseconds) {
        continue;
      }
    }

    expandedInstances = [
      ...expandedInstances,
      {
        id: generateId(instance),
        type: "scheduleInstance",
        scheduleId,
        title: eventName,
        dtstart: new Date(instance.epochMilliseconds),
        dtend: new Date(instance.add(eventDuration).epochMilliseconds),
        maxQuantity: eventMaxQuantity,
      },
    ];
  }

  return expandedInstances;
}
