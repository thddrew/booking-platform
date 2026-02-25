import { describe, expect, it } from "bun:test";

/**
 * Tests the customer deduplication logic used by the duplicates endpoint.
 */

interface MockCustomer {
	id: string;
	email: string | null | undefined;
	fullName: string | null | undefined;
	createdAt: string;
}

function findDuplicates(customers: MockCustomer[]) {
	const emailMap = new Map<string, MockCustomer[]>();

	for (const customer of customers) {
		if (!customer.email) continue;
		const key = customer.email.toLowerCase();
		if (!emailMap.has(key)) emailMap.set(key, []);
		emailMap.get(key)?.push(customer);
	}

	return Array.from(emailMap.entries())
		.filter(([, group]) => group.length > 1)
		.map(([email, group]) => ({
			email,
			count: group.length,
			customers: group.sort(
				(a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			),
		}));
}

function validateMergeRequest(
	keepId: string | undefined,
	mergeIds: string[] | undefined,
): { valid: boolean; error?: string } {
	if (!keepId || !mergeIds || !Array.isArray(mergeIds) || mergeIds.length === 0) {
		return { valid: false, error: "keepId and mergeIds[] are required" };
	}
	if (mergeIds.includes(keepId)) {
		return { valid: false, error: "keepId cannot be in mergeIds" };
	}
	return { valid: true };
}

const customers: MockCustomer[] = [
	{ id: "c1", email: "alice@test.com", fullName: "Alice A", createdAt: "2026-01-01T00:00:00Z" },
	{ id: "c2", email: "alice@test.com", fullName: "Alice B", createdAt: "2026-02-01T00:00:00Z" },
	{ id: "c3", email: "ALICE@TEST.COM", fullName: "Alice C", createdAt: "2026-03-01T00:00:00Z" },
	{ id: "c4", email: "bob@test.com", fullName: "Bob", createdAt: "2026-01-15T00:00:00Z" },
	{ id: "c5", email: null, fullName: "No Email", createdAt: "2026-01-20T00:00:00Z" },
	{ id: "c6", email: undefined, fullName: "Undefined Email", createdAt: "2026-01-25T00:00:00Z" },
];

describe("findDuplicates", () => {
	it("finds customers with the same email (case-insensitive)", () => {
		const dupes = findDuplicates(customers);
		expect(dupes).toHaveLength(1);
		expect(dupes[0].email).toBe("alice@test.com");
		expect(dupes[0].count).toBe(3);
	});

	it("sorts duplicates by createdAt (oldest first)", () => {
		const dupes = findDuplicates(customers);
		expect(dupes[0].customers[0].id).toBe("c1");
		expect(dupes[0].customers[2].id).toBe("c3");
	});

	it("skips customers without email", () => {
		const dupes = findDuplicates(customers);
		const allIds = dupes.flatMap((d) => d.customers.map((c) => c.id));
		expect(allIds).not.toContain("c5");
		expect(allIds).not.toContain("c6");
	});

	it("returns empty when no duplicates", () => {
		const unique: MockCustomer[] = [
			{ id: "a", email: "a@t.com", fullName: "A", createdAt: "2026-01-01T00:00:00Z" },
			{ id: "b", email: "b@t.com", fullName: "B", createdAt: "2026-01-01T00:00:00Z" },
		];
		expect(findDuplicates(unique)).toHaveLength(0);
	});

	it("handles empty array", () => {
		expect(findDuplicates([])).toHaveLength(0);
	});
});

describe("validateMergeRequest", () => {
	it("accepts valid request", () => {
		expect(validateMergeRequest("c1", ["c2", "c3"]).valid).toBe(true);
	});

	it("rejects missing keepId", () => {
		expect(validateMergeRequest(undefined, ["c2"]).valid).toBe(false);
	});

	it("rejects missing mergeIds", () => {
		expect(validateMergeRequest("c1", undefined).valid).toBe(false);
	});

	it("rejects empty mergeIds", () => {
		expect(validateMergeRequest("c1", []).valid).toBe(false);
	});

	it("rejects keepId in mergeIds", () => {
		const r = validateMergeRequest("c1", ["c1", "c2"]);
		expect(r.valid).toBe(false);
		expect(r.error).toContain("keepId");
	});
});
