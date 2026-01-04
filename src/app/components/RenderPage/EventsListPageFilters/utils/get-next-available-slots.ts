import { expandSchedule } from "@/collections/Bookings/utils/expand-schedule";
import { getEventDuration } from "@/collections/Bookings/utils/get-event-duration";
import type { Event } from "@/payload-types";

export function getNextAvailableSlots(
	event: Event,
	dateRangeStart: Date | null,
	dateRangeEnd: Date | null,
): Array<{ dtstart: Date; dtend: Date }> {
	const schedules = event.schedules?.schedule?.filter((s) => s.isActive !== false) || [];

	if (schedules.length === 0) {
		return [];
	}

	const now = new Date();
	const viewStart = dateRangeStart || now;
	const viewEnd = dateRangeEnd || (() => {
		const end = new Date();
		end.setDate(end.getDate() + 30);
		return end;
	})();

	const allInstances: Array<{ dtstart: Date; dtend: Date }> = [];

	for (const schedule of schedules) {
		if (!schedule.id) continue;

		if (!schedule.rrulestring) {
			const dtstart = new Date(schedule.dtstart);
			const dtend = new Date(schedule.dtend);

			if (dtstart >= viewStart && dtstart <= viewEnd && dtend > now) {
				allInstances.push({ dtstart, dtend });
			}
		} else {
			const eventDuration = getEventDuration(schedule.dtstart, schedule.dtend);
			const expandedInstances = expandSchedule({
				rruleString: schedule.rrulestring,
				eventMaxQuantity: event.maxQuantity ?? 0,
				eventDuration,
				scheduleId: schedule.id,
				eventName: event.title,
				viewStart,
				viewEnd,
				config: {
					includePastDates: false,
					generateId: () => "",
				},
			});

			for (const instance of expandedInstances) {
				if (instance.dtend > now) {
					allInstances.push({
						dtstart: instance.dtstart,
						dtend: instance.dtend,
					});
				}
			}
		}
	}

	allInstances.sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());

	return allInstances.slice(0, 3);
}
