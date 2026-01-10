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

/**
 * Get the default connected Stripe account for a tenant (public access)
 */
export async function getTenantStripeAccount(tenantId: string): Promise<{
	stripeAccountId: string | null;
	error?: string;
}> {
	try {
		const payload = await getPayload({ config: configPromise });

		const accountsQuery = await payload.find({
			collection: "connectedAccounts",
			overrideAccess: true,
			where: {
				and: [
					{
						tenant: {
							equals: tenantId,
						},
					},
					{
						default: {
							equals: true,
						},
					},
				],
			},
			limit: 1,
		});

		const account = accountsQuery.docs[0];

		if (!account?.stripeAccountId) {
			return {
				stripeAccountId: null,
				error: "No Stripe account configured for this tenant",
			};
		}

		return {
			stripeAccountId: account.stripeAccountId,
		};
	} catch (err) {
		console.error("Failed to get tenant Stripe account:", err);
		return {
			stripeAccountId: null,
			error: "Failed to load payment configuration",
		};
	}
}

/**
 * Get booking details for the payment page
 */
export async function getBookingForPayment(bookingId: string, email: string): Promise<{
	success: boolean;
	booking?: {
		id: string;
		tenantId: string;
		pricingSnapshot: Record<string, unknown>;
		eventSnapshot: Record<string, unknown>;
		customerEmail: string;
		dtstart: string;
		dtend: string;
	};
	error?: string;
}> {
	try {
		const payload = await getPayload({ config: configPromise });

		const booking = await payload.findByID({
			collection: "bookings",
			id: bookingId,
		});

		if (!booking) {
			return {
				success: false,
				error: "Booking not found",
			};
		}

		// Parse customer snapshot to validate email
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

		// Validate email matches for security
		if (customerSnapshot.email !== email) {
			return {
				success: false,
				error: "Invalid booking access",
			};
		}

		// Parse pricing snapshot
		let pricingSnapshot: Record<string, unknown> = {};
		if (booking.pricingSnapshot) {
			if (typeof booking.pricingSnapshot === "string") {
				try {
					pricingSnapshot = JSON.parse(booking.pricingSnapshot);
				} catch {
					pricingSnapshot = {};
				}
			} else if (typeof booking.pricingSnapshot === "object") {
				pricingSnapshot = booking.pricingSnapshot as Record<string, unknown>;
			}
		}

		// Parse event snapshot
		let eventSnapshot: Record<string, unknown> = {};
		if (booking.eventSnapshot) {
			if (typeof booking.eventSnapshot === "string") {
				try {
					eventSnapshot = JSON.parse(booking.eventSnapshot);
				} catch {
					eventSnapshot = {};
				}
			} else if (typeof booking.eventSnapshot === "object") {
				eventSnapshot = booking.eventSnapshot as Record<string, unknown>;
			}
		}

		const tenantId = typeof booking.tenant === "string" ? booking.tenant : booking.tenant?.id;

		return {
			success: true,
			booking: {
				id: booking.id,
				tenantId: tenantId || "",
				pricingSnapshot,
				eventSnapshot,
				customerEmail: customerSnapshot.email || email,
				dtstart: booking.dtstart,
				dtend: booking.dtend,
			},
		};
	} catch (err) {
		console.error("Failed to get booking for payment:", err);
		return {
			success: false,
			error: "Failed to load booking",
		};
	}
}
