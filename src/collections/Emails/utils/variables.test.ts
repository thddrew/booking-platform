import { describe, expect, it } from "bun:test";
import type { Booking, Customer, Event } from "@/payload-types";
import { getVariables, getVariablesData, type VariablesContext } from "./variables";

describe("getVariables", () => {
	it("returns all expected variable names", () => {
		const variables = getVariables();
		const names = variables.map((v) => v.name);

		expect(names).toContain("customer-name");
		expect(names).toContain("event-name");
		expect(names).toContain("booking-id");
		expect(names).toContain("booking-start-date");
		expect(names).toContain("booking-end-date");
		expect(names).toContain("booking-updates");
	});

	it("generates human-readable labels", () => {
		const variables = getVariables();
		const labels = variables.map((v) => v.label);

		expect(labels).toContain("Customer Name");
		expect(labels).toContain("Event Name");
		expect(labels).toContain("Booking Id");
		expect(labels).toContain("Booking Start Date");
		expect(labels).toContain("Booking End Date");
	});

	it("returns correct number of variables", () => {
		const variables = getVariables();
		expect(variables).toHaveLength(6);
	});
});

describe("getVariablesData", () => {
	const variables = getVariables();

	it("extracts customer name from context", () => {
		const context: VariablesContext = {
			customer: { firstName: "Jane" } as Customer,
		};

		const data = getVariablesData({ variables, context });
		expect(data["customer-name"]).toBe("Jane");
	});

	it("extracts booking fields from context", () => {
		const context: VariablesContext = {
			booking: {
				id: "booking-123",
				dtstart: "2026-03-01T09:00:00.000Z",
				dtend: "2026-03-01T12:00:00.000Z",
				eventSnapshot: { title: "Yoga Class" } as unknown,
			} as Booking,
		};

		const data = getVariablesData({ variables, context });
		expect(data["booking-id"]).toBe("booking-123");
		expect(data["booking-start-date"]).toBe("2026-03-01T09:00:00.000Z");
		expect(data["booking-end-date"]).toBe("2026-03-01T12:00:00.000Z");
		expect(data["event-name"]).toBe("Yoga Class");
	});

	it("returns empty object when no context provided", () => {
		const context: VariablesContext = {};
		const data = getVariablesData({ variables, context });
		expect(Object.keys(data)).toHaveLength(0);
	});

	it("handles null customer gracefully", () => {
		const context: VariablesContext = { customer: null };
		const data = getVariablesData({ variables, context });
		expect(data["customer-name"]).toBeUndefined();
	});

	it("handles null booking gracefully", () => {
		const context: VariablesContext = { booking: null };
		const data = getVariablesData({ variables, context });
		expect(data["booking-id"]).toBeUndefined();
		expect(data["event-name"]).toBeUndefined();
	});

	it("combines customer and booking data", () => {
		const context: VariablesContext = {
			customer: { firstName: "Alex" } as Customer,
			booking: {
				id: "b-456",
				dtstart: "2026-04-01T10:00:00.000Z",
				dtend: "2026-04-01T11:00:00.000Z",
				eventSnapshot: { title: "Cooking Class" } as unknown,
			} as Booking,
		};

		const data = getVariablesData({ variables, context });
		expect(data["customer-name"]).toBe("Alex");
		expect(data["booking-id"]).toBe("b-456");
		expect(data["event-name"]).toBe("Cooking Class");
	});
});
