import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

export async function POST(request: Request) {
	try {
		const { eventId, dtstart, dtend, scheduleId, email, firstName } =
			await request.json();

		if (!eventId || !dtstart || !dtend || !email) {
			return NextResponse.json(
				{ error: "eventId, dtstart, dtend, and email are required" },
				{ status: 400 },
			);
		}

		const payload = await getPayload({ config: configPromise });

		const existing = await payload.find({
			collection: "waitlist",
			overrideAccess: true,
			where: {
				and: [
					{ event: { equals: eventId } },
					{ dtstart: { equals: dtstart } },
					{ email: { equals: email } },
				],
			},
			limit: 1,
		});

		if (existing.docs.length > 0) {
			return NextResponse.json({
				message: "You're already on the waitlist for this timeslot",
				id: existing.docs[0].id,
			});
		}

		const entry = await payload.create({
			collection: "waitlist",
			overrideAccess: true,
			data: {
				event: eventId,
				dtstart,
				dtend,
				scheduleId: scheduleId || null,
				email,
				firstName: firstName || null,
				notified: false,
			},
		});

		return NextResponse.json({
			message: "Added to waitlist! We'll notify you when a spot opens.",
			id: entry.id,
		});
	} catch (err) {
		console.error("Waitlist error:", err);
		return NextResponse.json(
			{ error: "Failed to join waitlist" },
			{ status: 500 },
		);
	}
}
