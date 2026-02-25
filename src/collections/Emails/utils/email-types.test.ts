import { describe, expect, it } from "bun:test";
import {
	BOOKING_CANCELLED,
	BOOKING_CONFIRMATION,
	BOOKING_EMAIL_TYPES,
	BOOKING_REMINDER,
	BOOKING_UPDATED,
} from "./email-types";

describe("email type constants", () => {
	it("has correct constant values", () => {
		expect(BOOKING_CONFIRMATION).toBe("bookingConfirmationEmail");
		expect(BOOKING_CANCELLED).toBe("bookingCancelledEmail");
		expect(BOOKING_UPDATED).toBe("bookingUpdatedEmail");
		expect(BOOKING_REMINDER).toBe("bookingReminderEmail");
	});
});

describe("BOOKING_EMAIL_TYPES", () => {
	it("contains all four email types", () => {
		expect(BOOKING_EMAIL_TYPES).toHaveLength(4);
	});

	it("has correct labels and values", () => {
		const values = BOOKING_EMAIL_TYPES.map((t) => t.value);
		expect(values).toContain(BOOKING_CONFIRMATION);
		expect(values).toContain(BOOKING_CANCELLED);
		expect(values).toContain(BOOKING_UPDATED);
		expect(values).toContain(BOOKING_REMINDER);
	});

	it("has human-readable labels", () => {
		const labels = BOOKING_EMAIL_TYPES.map((t) => t.label);
		expect(labels).toContain("Booking Confirmation");
		expect(labels).toContain("Booking Cancelled");
		expect(labels).toContain("Booking Updated");
		expect(labels).toContain("Booking Reminder");
	});
});
