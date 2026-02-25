import { describe, expect, it } from "bun:test";
import { extractID } from "./extractID";
import { isNonNullish } from "./isNonNullish";
import { isTypedObject } from "./isTypedObject";

describe("extractID", () => {
	it("extracts id from object with id field", () => {
		expect(extractID({ id: "abc-123" } as any)).toBe("abc-123");
	});

	it("returns string id directly", () => {
		expect(extractID("abc-123" as any)).toBe("abc-123");
	});

	it("handles object with extra fields", () => {
		expect(extractID({ id: "abc", name: "Test" } as any)).toBe("abc");
	});
});

describe("isNonNullish", () => {
	it("returns true for non-null values", () => {
		expect(isNonNullish("hello")).toBe(true);
		expect(isNonNullish(0)).toBe(true);
		expect(isNonNullish(false)).toBe(true);
		expect(isNonNullish("")).toBe(true);
		expect(isNonNullish({})).toBe(true);
		expect(isNonNullish([])).toBe(true);
	});

	it("returns false for null", () => {
		expect(isNonNullish(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isNonNullish(undefined)).toBe(false);
	});
});

describe("isTypedObject", () => {
	it("returns true for objects", () => {
		expect(isTypedObject({ id: "abc" })).toBe(true);
		expect(isTypedObject({})).toBe(true);
		expect(isTypedObject([])).toBe(true);
	});

	it("returns false for strings", () => {
		expect(isTypedObject("abc")).toBe(false);
	});

	it("returns false for numbers", () => {
		expect(isTypedObject(123)).toBe(false);
	});

	it("returns false for null", () => {
		expect(isTypedObject(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isTypedObject(undefined)).toBe(false);
	});
});
