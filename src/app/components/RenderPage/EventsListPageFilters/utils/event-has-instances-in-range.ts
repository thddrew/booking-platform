import { RRuleTemporal } from "rrule-temporal";
import { getEventDuration } from "@/collections/Bookings/utils/get-event-duration";
import type { Event } from "@/payload-types";

export function eventHasInstancesInRange(
	event: Event,
	startDate: Date | null,
	endDate: Date | null,
): boolean {
	if (!startDate && !endDate) {
		return true;
	}

	const schedules = event.schedules?.schedule?.filter((s) => s.isActive !== false) || [];

	if (schedules.length === 0) {
		return false;
	}

	try {
		for (const schedule of schedules) {
			if (!schedule.id) continue;

			if (!schedule.rrulestring) {
				const dtstart = new Date(schedule.dtstart);
				const dtend = new Date(schedule.dtend);

				if (startDate && endDate) {
					if (dtstart <= endDate && dtend >= startDate) {
						return true;
					}
				} else if (startDate) {
					if (dtend >= startDate) {
						return true;
					}
				} else if (endDate) {
					if (dtstart <= endDate) {
						return true;
					}
				}
			} else {
				const eventDuration = getEventDuration(schedule.dtstart, schedule.dtend);
				const rule = new RRuleTemporal({ rruleString: schedule.rrulestring });

				const queryStart = startDate || new Date(0);
				const queryEnd = endDate || new Date(Number.MAX_SAFE_INTEGER);

				const occurrences = rule.between(queryStart, queryEnd, true);

				for (const occurrence of occurrences) {
					const occurrenceEnd = occurrence.add(eventDuration);
					const occurrenceEndDate = new Date(occurrenceEnd.epochMilliseconds);
					const occurrenceStartDate = new Date(occurrence.epochMilliseconds);

					if (startDate && endDate) {
						if (occurrenceStartDate <= endDate && occurrenceEndDate >= startDate) {
							return true;
						}
					} else if (startDate) {
						if (occurrenceEndDate >= startDate) {
							return true;
						}
					} else if (endDate) {
						if (occurrenceStartDate <= endDate) {
							return true;
						}
					}
				}
			}
		}
	} catch {
		return false;
	}

	return false;
}
