import type { Payload } from "payload";
import { expandSchedule } from "@/collections/Bookings/utils/expand-schedule";
import { getEventDuration } from "@/collections/Bookings/utils/get-event-duration";
import { getEventPricingSummary } from "@/collections/Bookings/utils/use-event-pricing-summary";
import type { EventPriceType } from "@/collections/Events/utils/schemas";
import type { Event } from "@/payload-types";

export interface AvailableTimeslot {
	dtstart: Date;
	dtend: Date;
	scheduleId: string;
	scheduleName?: string;
	availableSpots: number;
	maxQuantity: number;
	isAvailable: boolean;
}

export async function getAvailableTimeslots({
	event,
	startDate,
	endDate,
	payload,
}: {
	event: Event;
	startDate: Date;
	endDate: Date;
	payload: Payload;
}): Promise<AvailableTimeslot[]> {
	const schedules = event.schedules?.schedule?.filter((s) => s.isActive !== false) || [];

	if (schedules.length === 0) {
		return [];
	}

	const allInstances: Array<{
		dtstart: Date;
		dtend: Date;
		scheduleId: string;
		scheduleName?: string;
		maxQuantity: number;
	}> = [];

	for (const schedule of schedules) {
		if (!schedule.id) continue;

		if (!schedule.rrulestring) {
			const dtstart = new Date(schedule.dtstart);
			const dtend = new Date(schedule.dtend);

			if (dtstart < startDate || dtstart > endDate) continue;

			allInstances.push({
				dtstart,
				dtend,
				scheduleId: schedule.id,
				scheduleName: schedule.scheduleName || undefined,
				maxQuantity: event.maxQuantity,
			});
		} else {
			const eventDuration = getEventDuration(schedule.dtstart, schedule.dtend);
			const expandedInstances = expandSchedule({
				rruleString: schedule.rrulestring,
				eventMaxQuantity: event.maxQuantity,
				eventDuration,
				scheduleId: schedule.id,
				eventName: event.title,
				viewStart: startDate,
				viewEnd: endDate,
				config: {
					includePastDates: false,
				},
			});

			for (const instance of expandedInstances) {
				allInstances.push({
					dtstart: instance.dtstart as Date,
					dtend: instance.dtend as Date,
					scheduleId: instance.scheduleId,
					scheduleName: schedule.scheduleName || undefined,
					maxQuantity: instance.maxQuantity,
				});
			}
		}
	}

	const bookingsQuery = await payload.find({
		collection: "bookings",
		where: {
			and: [
				{
					eventRelation: {
						equals: event.id,
					},
				},
				{
					dtstart: {
						greater_than_equal: startDate.toISOString(),
					},
				},
				{
					dtstart: {
						less_than_equal: endDate.toISOString(),
					},
				},
			],
		},
		limit: 1000,
	});

	const bookings = bookingsQuery.docs;

	const availableTimeslots: AvailableTimeslot[] = [];

	for (const instance of allInstances) {
		const overlappingBookings = bookings.filter((booking) => {
			const bookingStart = new Date(booking.dtstart);
			const bookingEnd = new Date(booking.dtend);

			return (
				(bookingStart >= instance.dtstart && bookingStart < instance.dtend) ||
				(bookingEnd > instance.dtstart && bookingEnd <= instance.dtend) ||
				(bookingStart <= instance.dtstart && bookingEnd >= instance.dtend)
			);
		});

		let bookedQuantity = 0;
		for (const booking of overlappingBookings) {
			if (booking.pricingSnapshot && typeof booking.pricingSnapshot === "object") {
				const pricingSummary = getEventPricingSummary(
					booking.pricingSnapshot as Record<string, EventPriceType>,
				);
				bookedQuantity += pricingSummary.totalQuantity;
			}
		}

		const availableSpots = Math.max(0, instance.maxQuantity - bookedQuantity);

		availableTimeslots.push({
			dtstart: instance.dtstart,
			dtend: instance.dtend,
			scheduleId: instance.scheduleId,
			scheduleName: instance.scheduleName,
			availableSpots,
			maxQuantity: instance.maxQuantity,
			isAvailable: availableSpots > 0,
		});
	}

	availableTimeslots.sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());

	return availableTimeslots;
}
