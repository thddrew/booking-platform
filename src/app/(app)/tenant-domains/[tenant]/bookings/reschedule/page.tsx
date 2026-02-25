import configPromise from "@payload-config";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import { RescheduleClient } from "@/app/components/RenderPage/reschedule-client";
import { getAvailableTimeslots } from "@/app/components/RenderPage/utils/get-available-timeslots";

export default async function ReschedulePage({
	params: paramsPromise,
	searchParams: searchParamsPromise,
}: {
	params: Promise<{ tenant: string }>;
	searchParams: Promise<{
		bookingId?: string;
		email?: string;
	}>;
}) {
	const params = await paramsPromise;
	const searchParams = await searchParamsPromise;
	const { bookingId, email } = searchParams;

	if (!bookingId || !email) {
		redirect(`/tenant-domains/${params.tenant}/events`);
	}

	const payload = await getPayload({ config: configPromise });

	const bookingsQuery = await payload.find({
		collection: "bookings",
		overrideAccess: true,
		where: { id: { equals: bookingId } },
		limit: 1,
	});

	const booking = bookingsQuery.docs[0];
	if (!booking) return notFound();

	let customerSnapshot: { email?: string } = {};
	if (booking.customerSnapshot) {
		if (typeof booking.customerSnapshot === "string") {
			try {
				customerSnapshot = JSON.parse(booking.customerSnapshot);
			} catch {
				customerSnapshot = {};
			}
		} else if (typeof booking.customerSnapshot === "object") {
			customerSnapshot = booking.customerSnapshot as typeof customerSnapshot;
		}
	}

	if (customerSnapshot.email !== email) return notFound();

	const eventId =
		typeof booking.eventRelation === "string"
			? booking.eventRelation
			: booking.eventRelation?.id;

	if (!eventId) return notFound();

	const event = await payload.findByID({
		collection: "events",
		id: eventId,
		overrideAccess: true,
	});

	if (!event) return notFound();

	let eventSnapshot: { title?: string } = {};
	if (booking.eventSnapshot) {
		if (typeof booking.eventSnapshot === "string") {
			try {
				eventSnapshot = JSON.parse(booking.eventSnapshot);
			} catch {
				eventSnapshot = {};
			}
		} else if (typeof booking.eventSnapshot === "object") {
			eventSnapshot = booking.eventSnapshot as typeof eventSnapshot;
		}
	}

	const startDate = new Date();
	startDate.setHours(0, 0, 0, 0);
	const endDate = new Date();
	endDate.setDate(endDate.getDate() + 28);

	const timeslots = await getAvailableTimeslots({
		event,
		startDate,
		endDate,
		payload,
	});

	return (
		<RescheduleClient
			bookingId={bookingId}
			email={email}
			eventTitle={eventSnapshot.title || event.title || "Event"}
			currentDtstart={booking.dtstart}
			currentDtend={booking.dtend}
			timeslots={timeslots.map((t) => ({
				dtstart: t.dtstart.toISOString(),
				dtend: t.dtend.toISOString(),
				scheduleId: t.scheduleId,
				isAvailable: t.isAvailable,
				availableSpots: t.availableSpots,
			}))}
			eventsPath={`/tenant-domains/${params.tenant}/events`}
			bookingPath={`/tenant-domains/${params.tenant}/bookings?bookingId=${bookingId}&email=${encodeURIComponent(email)}`}
		/>
	);
}
