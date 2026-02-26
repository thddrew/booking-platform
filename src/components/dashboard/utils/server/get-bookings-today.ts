"use server";

import { getTenantFromCookie } from "@payloadcms/plugin-multi-tenant/utilities";
import { headers } from "next/headers";
import { payloadSDK } from "@/lib/payload/payload-sdk";
import { getTodayInUTC } from "../get-today";

export const getBookingsToday = async (today: Date) => {
	const { startOfDay, endOfDay } = getTodayInUTC(today);
	const requestHeaders = await headers();
	const tenantId = getTenantFromCookie(requestHeaders, "text") as string | null;

	const where: Record<string, unknown> = {
		dtstart: {
			greater_than_equal: startOfDay.toISOString(),
			less_than_equal: endOfDay.toISOString(),
		},
	};

	if (tenantId) {
		where.tenant = { equals: tenantId };
	}

	const bookings = await payloadSDK.find({
		collection: "bookings",
		where,
		limit: 50,
	});

	return bookings;
};
