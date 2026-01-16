/**
 * Test Spec: View Event Detail Page
 *
 * Based on TC-1.1 from e2e-checkout-test-plan.md
 * Verifies event details are displayed correctly
 */

export default {
	goal: "Verify event details are displayed correctly on the event detail page",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to event detail page",
		"Verify event title is displayed",
		"Verify event description is displayed",
		"Verify booking panel is visible",
	],

	successCriteria: [
		"Event title is visible and matches expected content",
		"Event description is displayed",
		"Booking panel is present and visible",
		"Page loads without errors",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
		],
		tags: ["event-detail", "ui", "smoke"],
	},
};
