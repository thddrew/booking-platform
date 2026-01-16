/**
 * Test Spec: Select Date
 *
 * Based on TC-1.3 from e2e-checkout-test-plan.md
 * Verifies date selection updates available timeslots
 */

export default {
	goal: "Verify date selection updates available timeslots correctly",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to event detail page",
		"Click on a date button",
		"Verify the selected date button is highlighted",
		"Verify timeslots list updates to show slots for the selected date",
		"Click on a different date button",
		"Verify the new date is highlighted and previous date is deselected",
	],

	successCriteria: [
		"Selected date button is visually highlighted",
		"Timeslots list updates to show slots for selected date",
		"Previously selected date is deselected when clicking a new date",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have timeslots available on multiple dates",
		],
		tags: ["event-detail", "timeslots", "interaction"],
	},
};
