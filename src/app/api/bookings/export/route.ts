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

		const bookings = await payload.find({
			collection: "bookings",
			where,
			limit: 1000,
			sort: "-createdAt",
			overrideAccess: false,
			user,
		});

		const rows: string[] = [];
		rows.push(
			[
				"Booking ID",
				"Event",
				"Start Date",
				"End Date",
				"Customer Name",
				"Customer Email",
				"Customer Phone",
				"Payment Status",
				"Payment Method",
				"Created At",
			].join(","),
		);

		for (const booking of bookings.docs) {
			let customerName = "";
			let customerEmail = "";
			let customerPhone = "";

			if (booking.customerSnapshot) {
				const snapshot =
					typeof booking.customerSnapshot === "string"
						? JSON.parse(booking.customerSnapshot)
						: booking.customerSnapshot;
				customerName = (
					snapshot.fullName ||
					`${snapshot.firstName || ""} ${snapshot.lastName || ""}`.trim()
				).replace(/,/g, " ");
				customerEmail = snapshot.email || "";
				customerPhone = (snapshot.phone || "").replace(/,/g, " ");
			}

			let eventName = "";
			if (booking.eventSnapshot) {
				const snapshot =
					typeof booking.eventSnapshot === "string"
						? JSON.parse(booking.eventSnapshot)
						: booking.eventSnapshot;
				eventName = (snapshot.title || "").replace(/,/g, " ");
			}

			const row = [
				booking.id,
				`"${eventName}"`,
				booking.dtstart,
				booking.dtend,
				`"${customerName}"`,
				customerEmail,
				`"${customerPhone}"`,
				booking.paymentStatus || "pending",
				booking.paymentMethod || "",
				booking.createdAt,
			].join(",");

			rows.push(row);
		}

		const csv = rows.join("\n");
		const now = new Date().toISOString().split("T")[0];

		return new NextResponse(csv, {
			status: 200,
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="bookings-${now}.csv"`,
			},
		});
	} catch (err) {
		console.error("Failed to export bookings:", err);
		return NextResponse.json(
			{ error: "Failed to export bookings" },
			{ status: 500 },
		);
	}
}
