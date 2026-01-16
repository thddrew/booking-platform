/**
 * Test Spec: Navigate Without Timeslot Selection
 *
 * Based on TC-2.3 from e2e-checkout-test-plan.md
 * Verifies 'Book Event' button is disabled when no timeslot is selected
 */

export default {
	goal: "Verify 'Book Event' button is disabled when no timeslot is selected",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to event detail page",
		"Do not select a timeslot",
		"Verify 'Book Event' button is disabled",
		"Attempt to click 'Book Event' button",
		"Verify button click does not navigate",
		"Verify user remains on event detail page",
	],

	successCriteria: [
		"'Book Event' button is disabled",
		"Button click does not trigger navigation",
		"User remains on event detail page",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
		],
		tags: ["checkout", "validation", "ui"],
	},
};
