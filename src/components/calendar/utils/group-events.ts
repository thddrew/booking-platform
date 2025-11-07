import type { CalendarEvent } from "../schemas";

/**
 * Groups events by their start hour (0-23)
 * @param events Array of calendar events
 * @returns Map where key is hour (number) and value is array of events starting in that hour
 */
export function groupEventsByStartHour(
	events: CalendarEvent[],
): Map<number, CalendarEvent[]> {
	const grouped = new Map<number, CalendarEvent[]>();

	for (const event of events) {
		const dtstart =
			typeof event.dtstart === "string"
				? new Date(event.dtstart)
				: event.dtstart;
		const hour = dtstart.getHours();

		if (!grouped.has(hour)) {
			grouped.set(hour, []);
		}
		grouped.get(hour)!.push(event);
	}

	return grouped;
}

/**
 * Determines if events should be collapsed into a grouped card
 * @param count Number of events
 * @returns true if count > 2, false otherwise
 */
export function shouldCollapseEvents(count: number): boolean {
	return count > 2;
}

