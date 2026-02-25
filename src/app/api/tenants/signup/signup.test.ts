import { describe, expect, it } from "bun:test";

function generateSlug(businessName: string): string {
	return businessName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function validateSignupInput(input: {
	businessName?: string;
	email?: string;
	password?: string;
}): { valid: boolean; error?: string } {
	if (!input.businessName || !input.email || !input.password) {
		return {
			valid: false,
			error: "Business name, email, and password are required",
		};
	}
	if (input.password.length < 6) {
		return { valid: false, error: "Password must be at least 6 characters" };
	}
	const slug = generateSlug(input.businessName);
	if (!slug) {
		return { valid: false, error: "Invalid business name" };
	}
	return { valid: true };
}

describe("generateSlug", () => {
	it("converts business name to URL-safe slug", () => {
		expect(generateSlug("Sunset Kayak Tours")).toBe("sunset-kayak-tours");
	});

	it("handles special characters", () => {
		expect(generateSlug("Sarah's Cooking Class!")).toBe(
			"sarah-s-cooking-class",
		);
	});

	it("handles multiple spaces and symbols", () => {
		expect(generateSlug("  My   Business  ")).toBe("my-business");
	});

	it("handles all-special-character names", () => {
		expect(generateSlug("!!!")).toBe("");
	});

	it("handles numbers", () => {
		expect(generateSlug("Studio 54 Dance")).toBe("studio-54-dance");
	});

	it("trims leading/trailing hyphens", () => {
		expect(generateSlug("-test-")).toBe("test");
	});
});

describe("validateSignupInput", () => {
	it("accepts valid input", () => {
		const r = validateSignupInput({
			businessName: "Test Biz",
			email: "test@biz.com",
			password: "secure123",
		});
		expect(r.valid).toBe(true);
	});

	it("rejects missing business name", () => {
		const r = validateSignupInput({ email: "t@t.com", password: "123456" });
		expect(r.valid).toBe(false);
		expect(r.error).toContain("required");
	});

	it("rejects missing email", () => {
		const r = validateSignupInput({ businessName: "Biz", password: "123456" });
		expect(r.valid).toBe(false);
	});

	it("rejects missing password", () => {
		const r = validateSignupInput({ businessName: "Biz", email: "t@t.com" });
		expect(r.valid).toBe(false);
	});

	it("rejects short password", () => {
		const r = validateSignupInput({
			businessName: "Biz",
			email: "t@t.com",
			password: "12345",
		});
		expect(r.valid).toBe(false);
		expect(r.error).toContain("6 characters");
	});

	it("rejects invalid business name (no alphanumeric chars)", () => {
		const r = validateSignupInput({
			businessName: "!!!",
			email: "t@t.com",
			password: "123456",
		});
		expect(r.valid).toBe(false);
		expect(r.error).toContain("Invalid");
	});
});
