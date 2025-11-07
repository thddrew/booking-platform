import { Temporal } from "@js-temporal/polyfill";

export const getTodayInUTC = (localToday: Date) => {
	const startOfDay = new Date(localToday.setHours(0, 0, 0, 0));

	const endOfDay = new Date(localToday.setHours(23, 59, 59, 999));

	return { startOfDay, endOfDay };
};
