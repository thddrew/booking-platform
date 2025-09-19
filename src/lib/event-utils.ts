import { RRuleTemporal } from "rrule-temporal";
import { Temporal } from "temporal-polyfill";
import type { CalendarEvent } from "@/components/calendar/types";

/**
 * Expands recurring events into individual occurrences for a given date range.
 *
 * @param events - The list of base calendar events, some of which may be recurring.
 * @param viewStart - The start date of the view range.
 * @param viewEnd - The end date of the view range.
 * @returns A new list of events including all single events and expanded recurring occurrences.
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  viewStart: Date,
  viewEnd: Date
): CalendarEvent[] {
  const expandedEvents: CalendarEvent[] = [];

  for (const event of events) {
    if (event.rrulestring && event.dtstart && event.dtend) {
      // This is a recurring event
      try {
        const rule = new RRuleTemporal({ rruleString: event.rrulestring });
        const duration = Temporal.Duration.from(
          Temporal.ZonedDateTime.from(event.dtstart.toISOString()).until(
            Temporal.ZonedDateTime.from(event.dtend.toISOString())
          )
        );

        const occurrences = rule.between(viewStart, viewEnd, true);

        for (const occurrence of occurrences) {
          const occurrenceStart = new Date(occurrence.toString());
          const occurrenceEnd = new Date(occurrence.add(duration).toString());

          expandedEvents.push({
            ...event,
            id: `${event.id}-${occurrence.epochMilliseconds}`, // Create a unique ID for the occurrence
            start: occurrenceStart,
            end: occurrenceEnd,
            // Nullify recurrence properties for the generated instance
            rrulestring: undefined,
            dtstart: undefined,
            dtend: undefined,
          });
        }
      } catch (error) {
        console.error(`Error processing rrule for event ${event.id}:`, error);
        // If there's an error, just add the original event to the list
        expandedEvents.push(event);
      }
    } else {
      // This is a single event, add it to the list if it's in range
      // The filtering will happen in the view components, so just add it
      expandedEvents.push(event);
    }
  }

  return expandedEvents;
}
