import { describe, expect, it } from "bun:test";
import { PAYMENT_STATUS, mapStatusToVariant } from "./payment-statuses";

describe("PAYMENT_STATUS", () => {
	it("has processing status", () => {
		expect(PAYMENT_STATUS.processing).toBe("processing");
	});
});

describe("mapStatusToVariant", () => {
	it("maps complete to success", () => {
		expect(mapStatusToVariant.complete).toBe("success");
	});

	it("maps expired to destructive", () => {
		expect(mapStatusToVariant.expired).toBe("destructive");
	});

	it("maps open to warning", () => {
		expect(mapStatusToVariant.open).toBe("warning");
	});

	it("maps refunded to secondary", () => {
		expect(mapStatusToVariant.refunded).toBe("secondary");
	});
});
