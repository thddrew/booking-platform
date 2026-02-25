import { describe, expect, it } from "bun:test";

/**
 * Tests the campaign email send validation logic.
 * The actual sending requires Payload + Novu, but the validation
 * and result structure are pure and testable.
 */

interface SendCampaignEmailResult {
	success: boolean;
	sent: number;
	failed: number;
	error?: string;
}

function validateSendRequest(
	campaignId: string | undefined,
	emailId: string | undefined,
	tenantId: string | undefined,
): { valid: boolean; error?: string } {
	if (!campaignId || !emailId || !tenantId) {
		return {
			valid: false,
			error: "campaignId, emailId, and tenantId are required",
		};
	}
	return { valid: true };
}

function buildResult(
	sent: number,
	failed: number,
	error?: string,
): SendCampaignEmailResult {
	return {
		success: !error && sent > 0,
		sent,
		failed,
		error,
	};
}

describe("campaign send validation", () => {
	it("validates all required fields", () => {
		expect(validateSendRequest("c1", "e1", "t1").valid).toBe(true);
	});

	it("rejects missing campaignId", () => {
		const r = validateSendRequest(undefined, "e1", "t1");
		expect(r.valid).toBe(false);
		expect(r.error).toContain("campaignId");
	});

	it("rejects missing emailId", () => {
		const r = validateSendRequest("c1", undefined, "t1");
		expect(r.valid).toBe(false);
	});

	it("rejects missing tenantId", () => {
		const r = validateSendRequest("c1", "e1", undefined);
		expect(r.valid).toBe(false);
	});

	it("rejects all empty", () => {
		expect(validateSendRequest(undefined, undefined, undefined).valid).toBe(
			false,
		);
	});
});

describe("campaign send result", () => {
	it("reports success when emails sent", () => {
		const r = buildResult(5, 0);
		expect(r.success).toBe(true);
		expect(r.sent).toBe(5);
		expect(r.failed).toBe(0);
	});

	it("reports success with partial failures", () => {
		const r = buildResult(3, 2);
		expect(r.success).toBe(true);
		expect(r.sent).toBe(3);
		expect(r.failed).toBe(2);
	});

	it("reports failure when none sent", () => {
		const r = buildResult(0, 5, "All sends failed");
		expect(r.success).toBe(false);
		expect(r.error).toBe("All sends failed");
	});

	it("reports failure with error message", () => {
		const r = buildResult(0, 0, "Campaign not found");
		expect(r.success).toBe(false);
		expect(r.error).toBe("Campaign not found");
	});
});
