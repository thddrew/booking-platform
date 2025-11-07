"use server";

import { payloadSDK } from "@/lib/payload/payload-sdk";
import { getTodayInUTC } from "../get-today";

export const getBookingsToday = async (today: Date) => {
	const { startOfDay, endOfDay } = getTodayInUTC(today);

	const bookings = await payloadSDK.find({
		collection: "bookings",
		where: {
			dtstart: {
				greater_than_equal: startOfDay.toISOString(),
				less_than_equal: endOfDay.toISOString(),
			},
		},
		limit: 50,
	});

	return bookings;
};
