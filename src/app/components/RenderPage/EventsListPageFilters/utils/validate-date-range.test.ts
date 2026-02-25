import { describe, expect, it } from "bun:test";
import { validateDateRange } from "./validate-date-range";

const futureDate = (daysFromNow: number) => {
	const d = new Date();
	d.setDate(d.getDate() + daysFromNow);
	d.setHours(0, 0, 0, 0);
	return d;
};

const pastDate = (daysAgo: number) => {
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	d.setHours(0, 0, 0, 0);
	return d;
};

describe("validateDateRange", () => {
	it("returns valid with both dates null", () => {
		const result = validateDateRange(null, null);
		expect(result.isValid).toBe(true);
		expect(result.startDate).toBeNull();
		expect(result.endDate).toBeNull();
	});

	it("returns valid with only start date", () => {
		const start = futureDate(5);
		const result = validateDateRange(start, null);
		expect(result.isValid).toBe(true);
		expect(result.startDate).toEqual(start);
		expect(result.endDate).toBeNull();
	});

	it("returns valid with only end date", () => {
		const end = futureDate(10);
		const result = validateDateRange(null, end);
		expect(result.isValid).toBe(true);
		expect(result.startDate).toBeNull();
		expect(result.endDate).toEqual(end);
	});

	it("returns valid for a reasonable date range", () => {
		const start = futureDate(1);
		const end = futureDate(7);
		const result = validateDateRange(start, end);
		expect(result.isValid).toBe(true);
		expect(result.startDate).toEqual(start);
		expect(result.endDate).toEqual(end);
	});

	it("returns invalid when start date is in the past", () => {
		const start = pastDate(2);
		const result = validateDateRange(start, null);
		expect(result.isValid).toBe(false);
		expect(result.startDate).toBeNull();
		expect(result.endDate).toBeNull();
	});

	it("returns invalid when end date is before start date", () => {
		const start = futureDate(10);
		const end = futureDate(5);
		const result = validateDateRange(start, end);
		expect(result.isValid).toBe(false);
	});

	it("returns invalid when range exceeds 60 days", () => {
		const start = futureDate(1);
		const end = futureDate(62);
		const result = validateDateRange(start, end);
		expect(result.isValid).toBe(false);
	});

	it("returns valid for exactly 60 days", () => {
		const start = futureDate(1);
		const end = futureDate(61);
		const result = validateDateRange(start, end);
		expect(result.isValid).toBe(true);
	});
});
