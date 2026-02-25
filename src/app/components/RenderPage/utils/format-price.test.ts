import { describe, expect, it } from "bun:test";
import { formatPrice, formatPriceShort } from "./format-price";

describe("formatPrice", () => {
	it("formats CAD price", () => {
		expect(formatPrice(25, "cad")).toBe("CA$25.00");
	});

	it("formats USD price", () => {
		expect(formatPrice(9.99, "usd")).toBe("$9.99");
	});

	it("formats EUR price", () => {
		expect(formatPrice(30, "eur")).toBe("€30.00");
	});

	it("formats GBP price", () => {
		expect(formatPrice(15.5, "gbp")).toBe("£15.50");
	});

	it("formats AUD price", () => {
		expect(formatPrice(42, "aud")).toBe("A$42.00");
	});

	it("returns Free for zero amount", () => {
		expect(formatPrice(0, "usd")).toBe("Free");
		expect(formatPrice(0, "eur")).toBe("Free");
		expect(formatPrice(0)).toBe("Free");
	});

	it("defaults to CAD", () => {
		expect(formatPrice(10)).toBe("CA$10.00");
	});

	it("falls back to $ for unknown currency", () => {
		expect(formatPrice(10, "xyz")).toBe("$10.00");
	});

	it("handles decimal precision", () => {
		expect(formatPrice(19.999, "usd")).toBe("$20.00");
		expect(formatPrice(0.01, "usd")).toBe("$0.01");
	});
});

describe("formatPriceShort", () => {
	it("formats without decimals", () => {
		expect(formatPriceShort(25, "cad")).toBe("CA$25");
	});

	it("returns Free for zero", () => {
		expect(formatPriceShort(0, "usd")).toBe("Free");
	});

	it("rounds to whole number", () => {
		expect(formatPriceShort(25.99, "usd")).toBe("$26");
	});

	it("defaults to CAD", () => {
		expect(formatPriceShort(10)).toBe("CA$10");
	});

	it("uses correct symbols for all currencies", () => {
		expect(formatPriceShort(10, "eur")).toBe("€10");
		expect(formatPriceShort(10, "gbp")).toBe("£10");
		expect(formatPriceShort(10, "aud")).toBe("A$10");
	});
});
