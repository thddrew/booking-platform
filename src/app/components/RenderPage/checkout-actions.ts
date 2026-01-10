"use server";

import configPromise from "@payload-config";
import { getPayload } from "payload";

interface CustomerInfo {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
}

interface CreateGuestBookingParams {
	eventId: string;
	tenantId: string;
	dtstart: string;
	dtend: string;
	scheduleId: string;
	customerInfo: CustomerInfo;
	isFree: boolean;
}

interface CreateGuestBookingResult {
	success: boolean;
	bookingId?: string;
	error?: string;
}

export async function createGuestBooking({
	eventId,
	tenantId,
	dtstart,
	dtend,
	scheduleId,
	customerInfo,
	isFree,
}: CreateGuestBookingParams): Promise<CreateGuestBookingResult> {
	try {
		const payload = await getPayload({ config: configPromise });

		// Verify the event exists and belongs to the tenant
		const event = await payload.findByID({
			collection: "events",
			id: eventId,
		});

		if (!event || (typeof event.tenant === "string" ? event.tenant : event.tenant?.id) !== tenantId) {
			return {
				success: false,
				error: "Event not found",
			};
		}

		// Build the customer snapshot for guest booking
		const customerSnapshot = {
			firstName: customerInfo.firstName,
			lastName: customerInfo.lastName,
			fullName: `${customerInfo.firstName} ${customerInfo.lastName}`,
			email: customerInfo.email,
			phone: customerInfo.phone || null,
		};

		// Find schedule instance data if scheduleId is provided
		let selectedScheduleInstanceData: Record<string, unknown> | null = null;
		if (scheduleId && event.schedules?.schedule) {
			const schedule = event.schedules.schedule.find((s) => s.id === scheduleId);
			if (schedule) {
				selectedScheduleInstanceData = {
					scheduleId: schedule.id,
					scheduleName: schedule.scheduleName || event.title,
					dtstart,
					dtend,
					rrulestring: schedule.rrulestring || null,
				};
			}
		}

		// Build pricing snapshot from event prices
		const pricingSnapshot: Record<string, unknown> = {};
		const activePrices = event.prices?.filter((p) => p.isActive !== false) || [];
		for (const price of activePrices) {
			if (price.id) {
				pricingSnapshot[price.id] = {
					...price,
					quantity: 1, // Default to 1 for now
				};
			}
		}

		// Create the booking
		// Note: We use overrideAccess since this is a guest booking and the user isn't authenticated
		const booking = await payload.create({
			collection: "bookings",
			overrideAccess: true,
			data: {
				tenant: tenantId,
				eventRelation: eventId,
				dtstart,
				dtend,
				selectedScheduleInstanceData,
				customerSnapshot,
				pricingSnapshot,
				paymentMethod: isFree ? "payLater" : "payNow",
				// For free events, we could mark as complete
				// For paid events, payment status will be updated by Stripe webhook
				paymentStatus: isFree ? "complete" : null,
			},
		});

		return {
			success: true,
			bookingId: booking.id,
		};
	} catch (err) {
		console.error("Failed to create guest booking:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Failed to create booking",
		};
	}
}
