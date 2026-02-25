import { describe, expect, it } from "bun:test";

interface OnboardingSteps {
	accountCreated: boolean;
	eventCreated: boolean;
	paymentsSetup: boolean;
	pageShared: boolean;
}

function computeOnboardingState(steps: OnboardingSteps) {
	const completed = Object.values(steps).filter(Boolean).length;
	const total = Object.keys(steps).length;
	const isComplete = completed >= 3;
	const progress = Math.round((completed / total) * 100);
	return { completed, total, isComplete, progress };
}

describe("onboarding state computation", () => {
	it("brand new account — only account created", () => {
		const state = computeOnboardingState({
			accountCreated: true,
			eventCreated: false,
			paymentsSetup: false,
			pageShared: false,
		});
		expect(state.completed).toBe(1);
		expect(state.total).toBe(4);
		expect(state.isComplete).toBe(false);
		expect(state.progress).toBe(25);
	});

	it("event created — 2 of 4", () => {
		const state = computeOnboardingState({
			accountCreated: true,
			eventCreated: true,
			paymentsSetup: false,
			pageShared: false,
		});
		expect(state.completed).toBe(2);
		expect(state.isComplete).toBe(false);
		expect(state.progress).toBe(50);
	});

	it("payments set up — 3 of 4, considered complete", () => {
		const state = computeOnboardingState({
			accountCreated: true,
			eventCreated: true,
			paymentsSetup: true,
			pageShared: false,
		});
		expect(state.completed).toBe(3);
		expect(state.isComplete).toBe(true);
		expect(state.progress).toBe(75);
	});

	it("fully complete — 4 of 4", () => {
		const state = computeOnboardingState({
			accountCreated: true,
			eventCreated: true,
			paymentsSetup: true,
			pageShared: true,
		});
		expect(state.completed).toBe(4);
		expect(state.isComplete).toBe(true);
		expect(state.progress).toBe(100);
	});

	it("nothing done (edge case)", () => {
		const state = computeOnboardingState({
			accountCreated: false,
			eventCreated: false,
			paymentsSetup: false,
			pageShared: false,
		});
		expect(state.completed).toBe(0);
		expect(state.isComplete).toBe(false);
		expect(state.progress).toBe(0);
	});
});
