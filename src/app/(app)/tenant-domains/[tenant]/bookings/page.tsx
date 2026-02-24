import { notFound, redirect } from "next/navigation";
import { getBookingDetails } from "@/app/components/RenderPage/booking-actions";
import { BookingDetailsClient } from "@/app/components/RenderPage/booking-details-client";

export default async function BookingsPage({
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

	const result = await getBookingDetails(bookingId, email);

	if (!result.success || !result.booking) {
		notFound();
	}

	return (
		<BookingDetailsClient
			booking={result.booking}
			email={email}
			eventsPath={`/tenant-domains/${params.tenant}/events`}
		/>
	);
}
