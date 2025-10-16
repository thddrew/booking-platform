import { Temporal } from "@js-temporal/polyfill";
import type { CollectionBeforeChangeHook } from "payload";
import { type RRuleOptions, RRuleTemporal } from "rrule-temporal";
import type { Event } from "@/payload-types";
import { convertStringToArray } from "../utils/convertStringToArray";

const objToKeyArray = (args: Record<string, boolean | null | undefined>) => {
	const keys = Object.keys(args).flatMap((key) => (args[key] ? [key] : []));

	return keys;
};

export type Schedule = NonNullable<
	NonNullable<Event["schedules"]>["schedule"]
>[number];

const getUTCDateParts = (utcDateString: string) => {
	const date = new Date(utcDateString);

	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		day: date.getUTCDate(),
		hour: date.getUTCHours(),
		minute: date.getUTCMinutes(),
		second: date.getUTCSeconds(),
	};
};

const getUTCZonedDateTime = (dateParts: ReturnType<typeof getUTCDateParts>) => {
	return Temporal.ZonedDateTime.from({
		year: dateParts.year,
		month: dateParts.month,
		day: dateParts.day,
		hour: dateParts.hour,
		minute: dateParts.minute,
		second: dateParts.second,
		timeZone: "UTC",
	});
};

export const generateRruleFromSchedule = (schedule: Schedule) => {
	const {
		frequency,
		dtstart,
		until,
		SU,
		MO,
		TU,
		WE,
		TH,
		FR,
		SA,
		monthDays,
		months,
		interval,
	} = schedule;

	const temporalOptions: RRuleOptions = {
		// @ts-expect-error - matches the frequency enum but missing types export
		freq: frequency,
		byDay: objToKeyArray({ SU, MO, TU, WE, TH, FR, SA }),
		byMonthDay: monthDays ? convertStringToArray(monthDays, Number) : undefined,
		byMonth: months ? convertStringToArray(months, Number) : undefined,
		interval: interval ?? undefined,
	};

	if (!dtstart) return null;

	if (dtstart) {
		const datetime = getUTCDateParts(dtstart);
		// @ts-expect-error - dtstart exists in ManualOpts but not sure how to narrow it down here
		temporalOptions.dtstart = getUTCZonedDateTime(datetime);
	}

	if (until) {
		const datetime = getUTCDateParts(until);
		// @ts-expect-error - until exists in ManualOpts but not sure how to narrow it down here
		temporalOptions.until = getUTCZonedDateTime(datetime);
	}

	return new RRuleTemporal(temporalOptions);
};

export const generateRrulestring: CollectionBeforeChangeHook<Event> = async ({
	data,
}) => {
	if (data.schedules?.schedule) {
		const schedules = data.schedules?.schedule;
		// TODO: consider performance for bulk schedules (low priority)
		const updatedSchedules = schedules?.map((schedule) => {
			if (!schedule.isRecurring) return schedule;

			const rrule = generateRruleFromSchedule(schedule);
			schedule.rrulestring = rrule ? rrule.toString() : null;

			return schedule;
		});

		data.schedules.schedule = updatedSchedules;

		return data;
	}

	return data;
};
