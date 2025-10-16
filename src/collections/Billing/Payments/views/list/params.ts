import {
	createSearchParamsCache,
	parseAsInteger,
	parseAsString,
} from "nuqs/server";

export const paymentIntentsParsers = {
	limit: parseAsInteger.withDefault(10),
	after: parseAsString,
};

export const paymentIntentsSearchParams = createSearchParamsCache(
	paymentIntentsParsers,
);
