import configPromise from "@payload-config";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

export async function GET(request: Request) {
	try {
		const headersList = await getHeaders();
		const payload = await getPayload({ config: configPromise });
		const { user } = await payload.auth({ headers: headersList });

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const url = new URL(request.url);
		const tenantId = url.searchParams.get("tenantId");

		const where: Record<string, unknown> = {};
		if (tenantId) {
			where.tenant = { equals: tenantId };
		}

		const customers = await payload.find({
			collection: "customers",
			where,
			limit: 1000,
			overrideAccess: false,
			user,
		});

		const emailMap = new Map<
			string,
			Array<{
				id: string;
				fullName: string | null | undefined;
				email: string | null | undefined;
				createdAt: string;
			}>
		>();

		for (const customer of customers.docs) {
			if (!customer.email) continue;
			const key = customer.email.toLowerCase();
			if (!emailMap.has(key)) {
				emailMap.set(key, []);
			}
			emailMap.get(key)?.push({
				id: customer.id,
				fullName: customer.fullName,
				email: customer.email,
				createdAt: customer.createdAt,
			});
		}

		const duplicates = Array.from(emailMap.entries())
			.filter(([, customers]) => customers.length > 1)
			.map(([email, customers]) => ({
				email,
				count: customers.length,
				customers: customers.sort(
					(a, b) =>
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
				),
			}));

		return NextResponse.json({
			totalCustomers: customers.totalDocs,
			duplicateEmails: duplicates.length,
			duplicates,
		});
	} catch (err) {
		console.error("Failed to find duplicates:", err);
		return NextResponse.json(
			{ error: "Failed to find duplicates" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const headersList = await getHeaders();
		const payload = await getPayload({ config: configPromise });
		const { user } = await payload.auth({ headers: headersList });

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { keepId, mergeIds } = await request.json();

		if (
			!keepId ||
			!mergeIds ||
			!Array.isArray(mergeIds) ||
			mergeIds.length === 0
		) {
			return NextResponse.json(
				{ error: "keepId and mergeIds[] are required" },
				{ status: 400 },
			);
		}

		const keepCustomer = await payload.findByID({
			collection: "customers",
			id: keepId,
			overrideAccess: false,
			user,
		});

		if (!keepCustomer) {
			return NextResponse.json(
				{ error: "Customer to keep not found" },
				{ status: 404 },
			);
		}

		let bookingsReassigned = 0;

		for (const mergeId of mergeIds) {
			const bookings = await payload.find({
				collection: "bookings",
				where: {
					customerRelation: { equals: mergeId },
				},
				overrideAccess: true,
				limit: 100,
			});

			for (const booking of bookings.docs) {
				await payload.update({
					collection: "bookings",
					id: booking.id,
					overrideAccess: true,
					data: {
						customerRelation: keepId,
					},
					context: { triggerAfterChange: false },
				});
				bookingsReassigned++;
			}

			await payload.delete({
				collection: "customers",
				id: mergeId,
				overrideAccess: false,
				user,
			});
		}

		return NextResponse.json({
			success: true,
			kept: keepId,
			merged: mergeIds.length,
			bookingsReassigned,
		});
	} catch (err) {
		console.error("Failed to merge customers:", err);
		return NextResponse.json(
			{ error: "Failed to merge customers" },
			{ status: 500 },
		);
	}
}
