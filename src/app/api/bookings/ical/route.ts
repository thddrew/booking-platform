import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

function formatICalDate(dateStr: string): string {
	return new Date(dateStr)
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}/, "");
}

function escapeICalText(text: string): string {
	return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const bookingId = url.searchParams.get("bookingId");
		const email = url.searchParams.get("email");

		if (!bookingId || !email) {
			return NextResponse.json(
				{ error: "bookingId and email are required" },
				{ status: 400 },
			);
		}

		const payload = await getPayload({ config: configPromise });

		const booking = await payload.findByID({
			collection: "bookings",
			id: bookingId,
			overrideAccess: true,
		});

		if (!booking) {
			return NextResponse.json({ error: "Booking not found" }, { status: 404 });
		}

		let customerSnapshot: { email?: string } = {};
		if (booking.customerSnapshot) {
			customerSnapshot =
				typeof booking.customerSnapshot === "string"
					? JSON.parse(booking.customerSnapshot)
					: (booking.customerSnapshot as typeof customerSnapshot);
		}

		if (customerSnapshot.email !== email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		let eventTitle = "Booking";
		if (booking.eventSnapshot) {
			const snapshot =
				typeof booking.eventSnapshot === "string"
					? JSON.parse(booking.eventSnapshot)
					: (booking.eventSnapshot as Record<string, unknown>);
			eventTitle = (snapshot.title as string) || "Booking";
		}

		const uid = `${booking.id}@bookify`;
		const dtstart = formatICalDate(booking.dtstart);
		const dtend = formatICalDate(booking.dtend);
		const now = formatICalDate(new Date().toISOString());

		const ical = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Bookify//Booking//EN",
			"CALSCALE:GREGORIAN",
			"METHOD:PUBLISH",
			"BEGIN:VEVENT",
			`UID:${uid}`,
			`DTSTAMP:${now}`,
			`DTSTART:${dtstart}`,
			`DTEND:${dtend}`,
			`SUMMARY:${escapeICalText(eventTitle)}`,
			`DESCRIPTION:${escapeICalText(`Booking ref: ${booking.id}`)}`,
			"STATUS:CONFIRMED",
			"END:VEVENT",
			"END:VCALENDAR",
		].join("\r\n");

		return new NextResponse(ical, {
			status: 200,
			headers: {
				"Content-Type": "text/calendar; charset=utf-8",
				"Content-Disposition": `attachment; filename="booking-${booking.id.slice(0, 8)}.ics"`,
			},
		});
	} catch (err) {
		console.error("iCal export error:", err);
		return NextResponse.json(
			{ error: "Failed to generate calendar file" },
			{ status: 500 },
		);
	}
}
