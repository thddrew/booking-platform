"use server";

import config from "@payload-config";
import { getTenantFromCookie } from "@payloadcms/plugin-multi-tenant/utilities";
import { headers } from "next/headers";
import { getPayload } from "payload";

export async function getOverviewStats() {
	const requestHeaders = await headers();
	const payload = await getPayload({ config });
	const tenant = getTenantFromCookie(requestHeaders, "text") as string | null;

	const now = new Date();
	const startOfMonth = new Date(
		now.getFullYear(),
		now.getMonth(),
		1,
	).toISOString();

	const bookingsQuery = await payload.find({
		collection: "bookings",
		where: {
			and: [
				...(tenant ? [{ tenant: { equals: tenant } }] : []),
				{ createdAt: { greater_than: startOfMonth } },
			],
		},
		limit: 0,
	});

	const eventsQuery = await payload.find({
		collection: "events",
		where: {
			and: [
				...(tenant ? [{ tenant: { equals: tenant } }] : []),
				{ isActive: { equals: true } },
				{ _status: { equals: "published" } },
			],
		},
		limit: 0,
	});

	const customersQuery = await payload.find({
		collection: "customers",
		where: {
			and: [
				...(tenant ? [{ tenant: { equals: tenant } }] : []),
				{ createdAt: { greater_than: startOfMonth } },
			],
		},
		limit: 0,
	});

	return {
		bookingsThisMonth: bookingsQuery.totalDocs,
		activeEvents: eventsQuery.totalDocs,
		customersThisMonth: customersQuery.totalDocs,
	};
}
