import { describe, expect, it } from "bun:test";
import { convertCentsToDollars } from "./convertCentsToDollars";
import { convertDollarsToCents } from "./convertDollarsToCents";
import { convertStringToArray } from "./convertStringToArray";
import { formatCurrency } from "./format-currency";

describe("convertDollarsToCents", () => {
	it("converts whole dollar amounts", () => {
		expect(convertDollarsToCents(25)).toBe(2500);
	});

	it("converts decimal dollar amounts", () => {
		expect(convertDollarsToCents(9.99)).toBe(999);
	});

	it("converts zero", () => {
		expect(convertDollarsToCents(0)).toBe(0);
	});

	it("returns default for null", () => {
		expect(convertDollarsToCents(null)).toBe(0);
	});

	it("returns default for undefined", () => {
		expect(convertDollarsToCents(undefined)).toBe(0);
	});

	it("uses custom default value", () => {
		expect(convertDollarsToCents(null, 100)).toBe(100);
	});
});

describe("convertCentsToDollars", () => {
	it("converts whole cent amounts", () => {
		expect(convertCentsToDollars(2500)).toBe(25);
	});

	it("converts decimal cent amounts", () => {
		expect(convertCentsToDollars(999)).toBe(9.99);
	});

	it("converts zero", () => {
		expect(convertCentsToDollars(0)).toBe(0);
	});

	it("handles floating point precision", () => {
		expect(convertCentsToDollars(1999)).toBe(19.99);
		expect(convertCentsToDollars(1)).toBe(0.01);
	});

	it("returns default for null", () => {
		expect(convertCentsToDollars(null)).toBe(0);
	});

	it("returns default for undefined", () => {
		expect(convertCentsToDollars(undefined)).toBe(0);
	});

	it("uses custom default value", () => {
		expect(convertCentsToDollars(null, 5)).toBe(5);
	});
});

describe("formatCurrency", () => {
	it("formats CAD", () => {
		expect(formatCurrency(25, "CAD")).toContain("25.00");
	});

	it("formats USD", () => {
		expect(formatCurrency(9.99, "USD")).toContain("9.99");
	});

	it("formats zero", () => {
		expect(formatCurrency(0, "CAD")).toContain("0.00");
	});

	it("defaults to CAD", () => {
		expect(formatCurrency(10)).toContain("10.00");
	});
});

describe("convertStringToArray", () => {
	it("splits comma-separated string", () => {
		expect(convertStringToArray("a,b,c")).toEqual(["a", "b", "c"]);
	});

	it("trims whitespace", () => {
		expect(convertStringToArray(" a , b , c ")).toEqual(["a", "b", "c"]);
	});

	it("returns undefined for empty string", () => {
		expect(convertStringToArray("")).toBeUndefined();
	});

	it("applies mapping function", () => {
		expect(convertStringToArray("1,2,3", Number)).toEqual([1, 2, 3]);
	});

	it("handles single item", () => {
		expect(convertStringToArray("solo")).toEqual(["solo"]);
	});
});
