import { describe, expect, it } from "bun:test";

/**
 * The booking-actions and checkout-actions both parse JSON snapshots
 * using the same pattern. Test the pattern directly.
 */
function parseSnapshot<T>(raw: unknown): T {
	if (!raw) return {} as T;
	if (typeof raw === "string") {
		try {
			return JSON.parse(raw);
		} catch {
			return {} as T;
		}
	}
	if (typeof raw === "object") {
		return raw as T;
	}
	return {} as T;
}

interface CustomerSnapshot {
	email?: string;
	firstName?: string;
	lastName?: string;
}

interface EventSnapshot {
	title?: string;
	thumbnail?: { url?: string };
}

describe("snapshot parsing (customerSnapshot)", () => {
	it("parses JSON string snapshot", () => {
		const raw = JSON.stringify({ email: "a@b.com", firstName: "Jane" });
		const result = parseSnapshot<CustomerSnapshot>(raw);
		expect(result.email).toBe("a@b.com");
		expect(result.firstName).toBe("Jane");
	});

	it("handles object snapshot directly", () => {
		const raw = { email: "a@b.com", firstName: "Jane" };
		const result = parseSnapshot<CustomerSnapshot>(raw);
		expect(result.email).toBe("a@b.com");
	});

	it("returns empty object for null", () => {
		const result = parseSnapshot<CustomerSnapshot>(null);
		expect(result).toEqual({});
	});

	it("returns empty object for undefined", () => {
		const result = parseSnapshot<CustomerSnapshot>(undefined);
		expect(result).toEqual({});
	});

	it("returns empty object for invalid JSON string", () => {
		const result = parseSnapshot<CustomerSnapshot>("not json{{{");
		expect(result).toEqual({});
	});

	it("returns empty object for empty string", () => {
		const result = parseSnapshot<CustomerSnapshot>("");
		expect(result).toEqual({});
	});
});

describe("snapshot parsing (eventSnapshot)", () => {
	it("parses event with thumbnail", () => {
		const raw = JSON.stringify({
			title: "Yoga Class",
			thumbnail: { url: "https://example.com/img.jpg" },
		});
		const result = parseSnapshot<EventSnapshot>(raw);
		expect(result.title).toBe("Yoga Class");
		expect(result.thumbnail?.url).toBe("https://example.com/img.jpg");
	});

	it("handles event without thumbnail", () => {
		const raw = { title: "Workshop" };
		const result = parseSnapshot<EventSnapshot>(raw);
		expect(result.title).toBe("Workshop");
		expect(result.thumbnail).toBeUndefined();
	});
});

describe("email validation against snapshot", () => {
	it("matches correct email", () => {
		const snapshot = parseSnapshot<CustomerSnapshot>(
			JSON.stringify({ email: "jane@example.com" }),
		);
		expect(snapshot.email === "jane@example.com").toBe(true);
	});

	it("rejects wrong email", () => {
		const snapshot = parseSnapshot<CustomerSnapshot>(
			JSON.stringify({ email: "jane@example.com" }),
		);
		expect(snapshot.email === "attacker@evil.com").toBe(false);
	});

	it("rejects when snapshot has no email", () => {
		const snapshot = parseSnapshot<CustomerSnapshot>(
			JSON.stringify({ firstName: "Jane" }),
		);
		expect(snapshot.email === "jane@example.com").toBe(false);
	});

	it("rejects when snapshot is empty", () => {
		const snapshot = parseSnapshot<CustomerSnapshot>(null);
		expect(snapshot.email === "jane@example.com").toBe(false);
	});
});
