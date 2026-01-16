/**
 * Test Spec: Select Timeslot
 *
 * Based on TC-1.4 from e2e-checkout-test-plan.md
 * Verifies timeslot selection works correctly
 */

export default {
	goal: "Verify timeslot selection works correctly and enables the Book Event button",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to event detail page",
		"Select a date",
		"Click on an available timeslot",
		"Verify the timeslot is visually highlighted",
		"Verify 'Book Event' button becomes enabled (if it was disabled)",
	],

	successCriteria: [
		"Selected timeslot is visually highlighted",
		"'Book Event' button becomes enabled after selecting a timeslot",
		"Timeslot shows selected state",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have at least one available timeslot",
		],
		tags: ["event-detail", "timeslots", "interaction"],
	},
};
