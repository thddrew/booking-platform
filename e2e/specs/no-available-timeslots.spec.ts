/**
 * Test Spec: No Available Timeslots
 *
 * Based on TC-1.6 from e2e-checkout-test-plan.md
 * Verifies handling when no timeslots are available
 */

export default {
	goal: "Verify appropriate messaging when no timeslots are available",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to event detail page with no available timeslots",
		"Verify booking panel displays appropriate message",
		"Verify 'Book Event' button is disabled or hidden",
	],

	successCriteria: [
		"Message displays: 'No available times at this time' or similar",
		"'Book Event' button is disabled or hidden",
		"No date selection buttons are shown (or they show no available slots)",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have no available timeslots (all fully booked or past dates)",
		],
		tags: ["event-detail", "timeslots", "edge-case"],
	},
};
