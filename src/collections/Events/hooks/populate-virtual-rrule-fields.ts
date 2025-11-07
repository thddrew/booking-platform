import type { FieldHook } from "payload";
import type { Event } from "@/payload-types";
import type { Schedule } from "./generateRrulestring";
import { parseRrulestring } from "./parse-rrulestring";

type VirtualOnlySchedule = Omit<
	Schedule,
	| "rrulestring"
	| "id"
	| "isActive"
	| "isRecurring"
	| "scheduleName"
	| "dtend"
	| "dtstart"
>;

type VirtualFieldNames = keyof VirtualOnlySchedule;

export const populateVirtualRruleFields: FieldHook<
	Event,
	unknown,
	Schedule
> = async ({ siblingData: schedule, value, field }) => {
	try {
		if (!schedule.rrulestring) return value;

		const options = parseRrulestring(schedule.rrulestring);

		switch (field.name as VirtualFieldNames) {
			case "interval": {
				return options.interval;
			}
			case "frequency": {
				return options.freq;
			}
			case "SU":
			case "MO":
			case "TU":
			case "WE":
			case "TH":
			case "FR":
			case "SA": {
				return options.byDay?.includes(field.name as string);
			}
			case "monthDays": {
				return options.byMonthDay?.join(",");
			}
			case "months": {
				return options.byMonth?.join(",");
			}
			case "until": {
				return options.until?.toString();
			}
			case "count": {
				return options.count;
			}
		}
	} catch (err) {
		console.error(err);
		return value;
	}
};
