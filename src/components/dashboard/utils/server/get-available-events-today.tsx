"use server";

import { payloadSDK } from "@/lib/payload/payload-sdk";
import { getTodayInUTC } from "../get-today";

export const getAvailableEventsToday = async (today: Date) => {
	const { startOfDay, endOfDay } = getTodayInUTC(today);

	const events = await payloadSDK.find({
		collection: "events",
		where: {
			isActive: {
				equals: true,
			},
			schedules__schedule__isActive: {
				equals: true,
			},
		},
		select: {
			title: true,
			schedules: true,
		},
	});

	return events;
};
