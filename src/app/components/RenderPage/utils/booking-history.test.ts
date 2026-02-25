import { describe, expect, it } from "bun:test";

/**
 * Tests the booking history filtering/sorting logic used by the
 * booking history page. The actual page is a server component that
 * queries Payload, but the filtering logic is pure and testable.
 */

interface MockBooking {
	id: string;
	dtstart: string;
	dtend: string;
	paymentStatus: string | null;
	customerSnapshot: unknown;
}

function filterBookingsByEmail(
	bookings: MockBooking[],
	email: string,
): MockBooking[] {
	return bookings.filter((booking) => {
		if (!booking.customerSnapshot) return false;
		const snapshot =
			typeof booking.customerSnapshot === "string"
				? (() => {
						try {
							return JSON.parse(booking.customerSnapshot);
						} catch {
							return {};
						}
					})()
				: (booking.customerSnapshot as Record<string, unknown>);
		return snapshot.email === email;
	});
}

function splitUpcomingPast(
	bookings: MockBooking[],
	now: Date,
): { upcoming: MockBooking[]; past: MockBooking[] } {
	return {
		upcoming: bookings.filter((b) => new Date(b.dtstart) >= now),
		past: bookings.filter((b) => new Date(b.dtstart) < now),
	};
}

const bookings: MockBooking[] = [
	{
		id: "b1",
		dtstart: "2026-04-01T10:00:00.000Z",
		dtend: "2026-04-01T11:00:00.000Z",
		paymentStatus: "complete",
		customerSnapshot: JSON.stringify({ email: "alice@test.com", firstName: "Alice" }),
	},
	{
		id: "b2",
		dtstart: "2025-12-01T14:00:00.000Z",
		dtend: "2025-12-01T16:00:00.000Z",
		paymentStatus: "complete",
		customerSnapshot: { email: "alice@test.com", firstName: "Alice" },
	},
	{
		id: "b3",
		dtstart: "2026-05-01T09:00:00.000Z",
		dtend: "2026-05-01T12:00:00.000Z",
		paymentStatus: null,
		customerSnapshot: JSON.stringify({ email: "bob@test.com", firstName: "Bob" }),
	},
	{
		id: "b4",
		dtstart: "2026-03-15T10:00:00.000Z",
		dtend: "2026-03-15T11:00:00.000Z",
		paymentStatus: "complete",
		customerSnapshot: null,
	},
];

describe("filterBookingsByEmail", () => {
	it("returns bookings matching the email", () => {
		const result = filterBookingsByEmail(bookings, "alice@test.com");
		expect(result).toHaveLength(2);
		expect(result.map((b) => b.id)).toEqual(["b1", "b2"]);
	});

	it("handles JSON string and object snapshots", () => {
		const result = filterBookingsByEmail(bookings, "alice@test.com");
		expect(result).toHaveLength(2);
	});

	it("returns empty for non-matching email", () => {
		const result = filterBookingsByEmail(bookings, "nobody@test.com");
		expect(result).toHaveLength(0);
	});

	it("skips bookings with null snapshot", () => {
		const result = filterBookingsByEmail(bookings, "alice@test.com");
		expect(result.find((b) => b.id === "b4")).toBeUndefined();
	});

	it("handles invalid JSON in snapshot", () => {
		const bad: MockBooking[] = [
			{
				id: "x",
				dtstart: "",
				dtend: "",
				paymentStatus: null,
				customerSnapshot: "not valid json{{{",
			},
		];
		const result = filterBookingsByEmail(bad, "alice@test.com");
		expect(result).toHaveLength(0);
	});
});

describe("splitUpcomingPast", () => {
	const now = new Date("2026-03-01T00:00:00.000Z");

	it("splits bookings into upcoming and past", () => {
		const aliceBookings = filterBookingsByEmail(bookings, "alice@test.com");
		const { upcoming, past } = splitUpcomingPast(aliceBookings, now);
		expect(upcoming).toHaveLength(1);
		expect(upcoming[0].id).toBe("b1");
		expect(past).toHaveLength(1);
		expect(past[0].id).toBe("b2");
	});

	it("all future bookings go to upcoming", () => {
		const bobBookings = filterBookingsByEmail(bookings, "bob@test.com");
		const { upcoming, past } = splitUpcomingPast(bobBookings, now);
		expect(upcoming).toHaveLength(1);
		expect(past).toHaveLength(0);
	});

	it("handles empty array", () => {
		const { upcoming, past } = splitUpcomingPast([], now);
		expect(upcoming).toHaveLength(0);
		expect(past).toHaveLength(0);
	});
});
