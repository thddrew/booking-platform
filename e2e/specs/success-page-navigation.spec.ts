/**
 * Test Spec: Success Page - Navigation
 *
 * Based on TC-7.7 from e2e-checkout-test-plan.md
 * Verifies navigation from success page works correctly
 */

export default {
	goal: "Verify navigation from success page to events listing works correctly",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Complete booking and view success page",
		"Verify 'Browse More Events' button is visible",
		"Click 'Browse More Events' button",
		"Verify navigation to events listing page",
	],

	successCriteria: [
		"'Browse More Events' button is visible and clickable",
		"Button navigates to events listing page",
		"URL is correct: /tenant-slugs/gold/events",
		"User can browse and book more events",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured",
		],
		tags: ["success-page", "navigation", "ui"],
	},
};
