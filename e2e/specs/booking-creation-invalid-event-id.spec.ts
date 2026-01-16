/**
 * Test Spec: Booking Creation - Invalid Event ID
 *
 * Based on TC-5.3 from e2e-checkout-test-plan.md
 * Verifies error handling for invalid event ID during booking creation
 */

export default {
	goal: "Verify error handling when attempting to create booking with invalid event ID",

	startUrl: "/tenant-slugs/gold/checkout?eventId=invalid-event-id-12345&dtstart=2026-01-20T13:00:00&dtend=2026-01-20T15:00:00",

	steps: [
		"Navigate to checkout page with invalid eventId",
		"Fill in customer information form",
		"Attempt to submit form",
		"Verify error message displays",
		"Verify error message indicates event not found",
		"Verify booking is not created",
	],

	successCriteria: [
		"Error message displays: 'Event not found' or similar",
		"Booking is not created",
		"User can correct and retry",
		"Error message is user-friendly",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
		],
		tags: ["checkout", "error-state", "validation", "edge-case"],
	},
};
