import { describe, expect, it } from "bun:test";
import type { Event } from "@/payload-types";
import { filterValidPrices } from "./filter-valid-prices";

const makeEvent = (
	prices: Array<{
		id: string;
		isActive?: boolean;
		stripePriceId?: string | null;
		amount: number;
		label: string;
	}>,
): Event =>
	({
		id: "evt-1",
		title: "Test Event",
		prices: prices.map((p) => ({
			id: p.id,
			isActive: p.isActive ?? true,
			stripePriceId: p.stripePriceId ?? null,
			amount: p.amount,
			label: p.label,
			description: null,
			quantityUnit: 1,
			quantity: 0,
		})),
	}) as unknown as Event;

describe("filterValidPrices", () => {
	it("keeps paid prices with a valid stripePriceId", () => {
		const event = makeEvent([
			{
				id: "p1",
				amount: 25,
				label: "Standard",
				stripePriceId: "price_abc123",
			},
		]);
		const result = filterValidPrices(event);
		expect(result.prices).toHaveLength(1);
		expect(result.prices![0].label).toBe("Standard");
	});

	it("removes paid prices without stripePriceId", () => {
		const event = makeEvent([
			{ id: "p1", amount: 25, label: "Standard", stripePriceId: null },
		]);
		const result = filterValidPrices(event);
		expect(result.prices).toHaveLength(0);
	});

	it("removes paid prices with empty string stripePriceId", () => {
		const event = makeEvent([
			{ id: "p1", amount: 25, label: "Standard", stripePriceId: "" },
		]);
		const result = filterValidPrices(event);
		expect(result.prices).toHaveLength(0);
	});

	it("keeps free prices ($0) even without stripePriceId", () => {
		const event = makeEvent([
			{ id: "p1", amount: 0, label: "Free Entry", stripePriceId: null },
		]);
		const result = filterValidPrices(event);
		expect(result.prices).toHaveLength(1);
		expect(result.prices![0].label).toBe("Free Entry");
	});

	it("removes inactive prices regardless of stripePriceId", () => {
		const event = makeEvent([
			{
				id: "p1",
				amount: 25,
				label: "Standard",
				stripePriceId: "price_abc",
				isActive: false,
			},
		]);
		const result = filterValidPrices(event);
		expect(result.prices).toHaveLength(0);
	});

	it("removes inactive free prices", () => {
		const event = makeEvent([
			{ id: "p1", amount: 0, label: "Free", isActive: false },
		]);
		const result = filterValidPrices(event);
		expect(result.prices).toHaveLength(0);
	});

	it("handles mixed paid/free/inactive prices correctly", () => {
		const event = makeEvent([
			{
				id: "p1",
				amount: 25,
				label: "Paid Valid",
				stripePriceId: "price_1",
			},
			{ id: "p2", amount: 45, label: "Paid No Stripe", stripePriceId: null },
			{ id: "p3", amount: 0, label: "Free Valid" },
			{ id: "p4", amount: 0, label: "Free Inactive", isActive: false },
			{
				id: "p5",
				amount: 10,
				label: "Paid Inactive",
				stripePriceId: "price_2",
				isActive: false,
			},
		]);
		const result = filterValidPrices(event);
		expect(result.prices).toHaveLength(2);
		expect(result.prices!.map((p) => p.label)).toEqual([
			"Paid Valid",
			"Free Valid",
		]);
	});

	it("returns empty array when event has no prices", () => {
		const event = { id: "evt-1", title: "Test", prices: [] } as unknown as Event;
		const result = filterValidPrices(event);
		expect(result.prices).toEqual([]);
	});

	it("returns empty array when prices is undefined", () => {
		const event = { id: "evt-1", title: "Test" } as unknown as Event;
		const result = filterValidPrices(event);
		expect(result.prices).toEqual([]);
	});

	it("preserves other event fields", () => {
		const event = makeEvent([
			{ id: "p1", amount: 0, label: "Free" },
		]);
		const result = filterValidPrices(event);
		expect(result.id).toBe("evt-1");
		expect(result.title).toBe("Test Event");
	});
});
