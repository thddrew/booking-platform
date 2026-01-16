import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const DATE_RANGE_MAX_DAYS = 60;

export function getTodayDate(): Date {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return today;
}

export function getMinStartDate(): Date {
	return getTodayDate();
}

export function parseDate(dateString: string | null | undefined): Date | null {
	if (!dateString) return null;
	const date = new Date(dateString);
	return Number.isNaN(date.getTime()) ? null : date;
}

function serializeDate(date: Date | null | undefined): string | null {
	if (!date) return null;
	return date.toISOString();
}

export const eventsListSearchParams = {
	search: parseAsString.withDefault(""),
	people: parseAsInteger,
	startDate: parseAsString.withOptions({
		parse: parseDate,
		serialize: serializeDate,
	}),
	endDate: parseAsString.withOptions({
		parse: parseDate,
		serialize: serializeDate,
	}),
};

export const eventsListSearchParamsCache = createSearchParamsCache(eventsListSearchParams);

export { eventsListSearchParams as eventsListSearchParamsParsers };
