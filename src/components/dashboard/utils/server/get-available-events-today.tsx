"use server";

import { getTenantFromCookie } from "@payloadcms/plugin-multi-tenant/utilities";
import { headers } from "next/headers";
import { payloadSDK } from "@/lib/payload/payload-sdk";
import { getTodayInUTC } from "../get-today";

export const getAvailableEventsToday = async (today: Date) => {
	const { startOfDay, endOfDay } = getTodayInUTC(today);
	const requestHeaders = await headers();
	const tenantId = getTenantFromCookie(requestHeaders, "text") as string | null;

	const where: Record<string, unknown> = {
		isActive: {
			equals: true,
		},
		schedules__schedule__isActive: {
			equals: true,
		},
	};

	if (tenantId) {
		where.tenant = { equals: tenantId };
	}

	const events = await payloadSDK.find({
		collection: "events",
		where,
		select: {
			title: true,
			schedules: true,
		},
	});

	return events;
};
