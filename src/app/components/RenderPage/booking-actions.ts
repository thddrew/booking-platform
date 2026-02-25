"use server";

import configPromise from "@payload-config";
import { getPayload } from "payload";

interface BookingDetails {
	id: string;
	dtstart: string;
	dtend: string;
	paymentStatus: string | null;
	customerSnapshot: {
		email?: string;
		firstName?: string;
		lastName?: string;
		fullName?: string;
		phone?: string | null;
	};
	eventSnapshot: {
		title?: string;
		subtitle?: string;
		thumbnail?: { url?: string };
	};
}

interface GetBookingDetailsResult {
	success: boolean;
	booking?: BookingDetails;
	error?: string;
}

export async function getBookingDetails(
	bookingId: string,
	email: string,
): Promise<GetBookingDetailsResult> {
	try {
		const payload = await getPayload({ config: configPromise });

		const bookingsQuery = await payload.find({
			collection: "bookings",
			overrideAccess: true,
			where: {
				id: {
					equals: bookingId,
				},
			},
			limit: 1,
		});

		const booking = bookingsQuery.docs[0];

		if (!booking) {
			return { success: false, error: "Booking not found" };
		}

		let customerSnapshot: BookingDetails["customerSnapshot"] = {};
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

		if (customerSnapshot.email !== email) {
			return { success: false, error: "Invalid booking access" };
		}

		let eventSnapshot: BookingDetails["eventSnapshot"] = {};
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

		return {
			success: true,
			booking: {
				id: booking.id,
				dtstart: booking.dtstart,
				dtend: booking.dtend,
				paymentStatus:
					typeof booking.paymentStatus === "string"
						? booking.paymentStatus
						: null,
				customerSnapshot,
				eventSnapshot,
			},
		};
	} catch (err) {
		console.error("Failed to get booking details:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Failed to load booking",
		};
	}
}

interface CancelBookingResult {
	success: boolean;
	error?: string;
}

export async function cancelBooking(
	bookingId: string,
	email: string,
): Promise<CancelBookingResult> {
	try {
		const payload = await getPayload({ config: configPromise });

		const bookingsQuery = await payload.find({
			collection: "bookings",
			overrideAccess: true,
			where: {
				id: {
					equals: bookingId,
				},
			},
			limit: 1,
		});

		const booking = bookingsQuery.docs[0];

		if (!booking) {
			return { success: false, error: "Booking not found" };
		}

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

		if (customerSnapshot.email !== email) {
			return { success: false, error: "Invalid booking access" };
		}

		await payload.delete({
			collection: "bookings",
			id: bookingId,
			overrideAccess: true,
			context: { triggerAfterChange: true },
		});

		return { success: true };
	} catch (err) {
		console.error("Failed to cancel booking:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Failed to cancel booking",
		};
	}
}

interface RescheduleBookingResult {
	success: boolean;
	error?: string;
}

export async function rescheduleBooking(
	bookingId: string,
	email: string,
	newDtstart: string,
	newDtend: string,
	newScheduleId?: string,
): Promise<RescheduleBookingResult> {
	try {
		const payload = await getPayload({ config: configPromise });

		const bookingsQuery = await payload.find({
			collection: "bookings",
			overrideAccess: true,
			where: { id: { equals: bookingId } },
			limit: 1,
		});

		const booking = bookingsQuery.docs[0];
		if (!booking) {
			return { success: false, error: "Booking not found" };
		}

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

		if (customerSnapshot.email !== email) {
			return { success: false, error: "Invalid booking access" };
		}

		// Build updated schedule instance data
		const scheduleInstanceData = newScheduleId
			? {
					id: `${newScheduleId}-${newDtstart}`,
					type: "scheduleInstance",
					scheduleId: newScheduleId,
					dtstart: newDtstart,
					dtend: newDtend,
				}
			: booking.selectedScheduleInstanceData;

		await payload.update({
			collection: "bookings",
			id: bookingId,
			overrideAccess: true,
			data: {
				dtstart: newDtstart,
				dtend: newDtend,
				selectedScheduleInstanceData: scheduleInstanceData,
			},
			context: { triggerAfterChange: true },
		});

		return { success: true };
	} catch (err) {
		console.error("Failed to reschedule booking:", err);
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "Failed to reschedule booking",
		};
	}
}
