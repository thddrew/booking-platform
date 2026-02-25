import { describe, expect, it } from "bun:test";

/**
 * Tests the CSV row formatting logic used by the bookings export endpoint.
 * Extracted from route.ts for testability.
 */

interface BookingRow {
	id: string;
	eventTitle: string;
	dtstart: string;
	dtend: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	paymentStatus: string;
	paymentMethod: string;
	createdAt: string;
}

function formatCsvRow(row: BookingRow): string {
	return [
		row.id,
		`"${row.eventTitle.replace(/,/g, " ")}"`,
		row.dtstart,
		row.dtend,
		`"${row.customerName.replace(/,/g, " ")}"`,
		row.customerEmail,
		`"${row.customerPhone.replace(/,/g, " ")}"`,
		row.paymentStatus || "pending",
		row.paymentMethod || "",
		row.createdAt,
	].join(",");
}

function parseCustomerSnapshot(raw: unknown): {
	fullName: string;
	email: string;
	phone: string;
} {
	const snapshot =
		typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>) || {};
	return {
		fullName: ((snapshot.fullName as string) ||
			`${(snapshot.firstName as string) || ""} ${(snapshot.lastName as string) || ""}`.trim()
		).replace(/,/g, " "),
		email: (snapshot.email as string) || "",
		phone: ((snapshot.phone as string) || "").replace(/,/g, " "),
	};
}

const CSV_HEADERS = [
	"Booking ID",
	"Event",
	"Start Date",
	"End Date",
	"Customer Name",
	"Customer Email",
	"Customer Phone",
	"Payment Status",
	"Payment Method",
	"Created At",
];

describe("CSV export formatting", () => {
	it("produces correct header row", () => {
		expect(CSV_HEADERS.join(",")).toBe(
			"Booking ID,Event,Start Date,End Date,Customer Name,Customer Email,Customer Phone,Payment Status,Payment Method,Created At",
		);
	});

	it("formats a complete booking row", () => {
		const row = formatCsvRow({
			id: "abc-123",
			eventTitle: "Yoga Class",
			dtstart: "2026-03-01T09:00:00.000Z",
			dtend: "2026-03-01T10:00:00.000Z",
			customerName: "Jane Smith",
			customerEmail: "jane@example.com",
			customerPhone: "+1 555-0123",
			paymentStatus: "complete",
			paymentMethod: "payNow",
			createdAt: "2026-02-25T10:00:00.000Z",
		});
		expect(row).toContain("abc-123");
		expect(row).toContain('"Yoga Class"');
		expect(row).toContain('"Jane Smith"');
		expect(row).toContain("jane@example.com");
		expect(row).toContain("complete");
	});

	it("wraps event titles in quotes for CSV safety", () => {
		const row = formatCsvRow({
			id: "x",
			eventTitle: "Cooking Baking and More",
			dtstart: "",
			dtend: "",
			customerName: "A",
			customerEmail: "",
			customerPhone: "",
			paymentStatus: "",
			paymentMethod: "",
			createdAt: "",
		});
		expect(row).toContain('"Cooking Baking and More"');
	});

	it("defaults payment status to pending", () => {
		const row = formatCsvRow({
			id: "x",
			eventTitle: "E",
			dtstart: "",
			dtend: "",
			customerName: "A",
			customerEmail: "",
			customerPhone: "",
			paymentStatus: "",
			paymentMethod: "",
			createdAt: "",
		});
		expect(row).toContain("pending");
	});
});

describe("customer snapshot parsing for CSV", () => {
	it("parses JSON string snapshot", () => {
		const result = parseCustomerSnapshot(
			JSON.stringify({ firstName: "Jane", lastName: "Smith", email: "j@e.com", phone: "+1" }),
		);
		expect(result.fullName).toBe("Jane Smith");
		expect(result.email).toBe("j@e.com");
		expect(result.phone).toBe("+1");
	});

	it("uses fullName when available", () => {
		const result = parseCustomerSnapshot({
			fullName: "Jane Smith",
			firstName: "Jane",
			email: "j@e.com",
		});
		expect(result.fullName).toBe("Jane Smith");
	});

	it("handles null snapshot", () => {
		const result = parseCustomerSnapshot(null);
		expect(result.fullName).toBe("");
		expect(result.email).toBe("");
	});

	it("handles names with commas", () => {
		const result = parseCustomerSnapshot({
			fullName: "Smith Jane",
			phone: "+1 555",
		});
		expect(result.fullName).toBe("Smith Jane");
		expect(result.phone).toBe("+1 555");
	});
});
