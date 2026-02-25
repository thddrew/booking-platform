import { describe, expect, it } from "bun:test";
import type { Booking } from "@/payload-types";
import {
	getSignificantChanges,
	hasCustomerChanged,
	hasPaymentStatusChanged,
	hasScheduleChanged,
} from "./booking-comparison";

const makeBooking = (overrides: Partial<Booking> = {}): Booking =>
	({
		id: "booking-1",
		dtstart: "2026-03-01T09:00:00.000Z",
		dtend: "2026-03-01T12:00:00.000Z",
		customerRelation: "cust-1",
		paymentStatus: "complete",
		...overrides,
	}) as unknown as Booking;

describe("hasScheduleChanged", () => {
	it("returns false when dates are the same", () => {
		const old = makeBooking();
		const current = makeBooking();
		expect(hasScheduleChanged(old, current)).toBe(false);
	});

	it("detects dtstart change", () => {
		const old = makeBooking();
		const current = makeBooking({ dtstart: "2026-03-02T09:00:00.000Z" });
		expect(hasScheduleChanged(old, current)).toBe(true);
	});

	it("detects dtend change", () => {
		const old = makeBooking();
		const current = makeBooking({ dtend: "2026-03-01T14:00:00.000Z" });
		expect(hasScheduleChanged(old, current)).toBe(true);
	});
});

describe("hasCustomerChanged", () => {
	it("returns false when customer is the same", () => {
		const old = makeBooking();
		const current = makeBooking();
		expect(hasCustomerChanged(old, current)).toBe(false);
	});

	it("detects customer change", () => {
		const old = makeBooking();
		const current = makeBooking({
			customerRelation: "cust-2" as any,
		});
		expect(hasCustomerChanged(old, current)).toBe(true);
	});
});

describe("hasPaymentStatusChanged", () => {
	it("returns false when status is the same", () => {
		const old = makeBooking();
		const current = makeBooking();
		expect(hasPaymentStatusChanged(old, current)).toBe(false);
	});

	it("detects payment status change", () => {
		const old = makeBooking({ paymentStatus: "processing" });
		const current = makeBooking({ paymentStatus: "complete" });
		expect(hasPaymentStatusChanged(old, current)).toBe(true);
	});
});

describe("getSignificantChanges", () => {
	it("returns all false when nothing changed", () => {
		const old = makeBooking();
		const current = makeBooking();
		const changes = getSignificantChanges(old, current);
		expect(changes).toEqual({
			schedule: false,
			customer: false,
			payment: false,
		});
	});

	it("detects multiple changes", () => {
		const old = makeBooking();
		const current = makeBooking({
			dtstart: "2026-04-01T10:00:00.000Z",
			paymentStatus: "expired",
		});
		const changes = getSignificantChanges(old, current);
		expect(changes.schedule).toBe(true);
		expect(changes.customer).toBe(false);
		expect(changes.payment).toBe(true);
	});
});
