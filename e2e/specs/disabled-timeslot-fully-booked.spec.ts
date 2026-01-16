/**
 * Test Spec: Disabled Timeslot (Fully Booked)
 *
 * Based on TC-1.5 from e2e-checkout-test-plan.md
 * Verifies fully booked timeslots are disabled and cannot be selected
 */

export default {
	goal: "Verify fully booked timeslots are disabled and show appropriate messaging",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to event detail page with a fully booked timeslot",
		"Verify fully booked timeslot displays 'Fully booked' text or similar",
		"Verify timeslot is visually disabled (reduced opacity or disabled styling)",
		"Attempt to click the fully booked timeslot",
		"Verify timeslot is not clickable",
		"Verify 'Book Event' button remains disabled if no timeslot is selected",
	],

	successCriteria: [
		"Fully booked timeslot shows 'Fully booked' text or similar indicator",
		"Timeslot is visually disabled",
		"Timeslot cannot be clicked",
		"'Book Event' button remains disabled when only fully booked timeslots are available",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have at least one fully booked timeslot",
		],
		tags: ["event-detail", "timeslots", "edge-case"],
	},
};
