/**
 * Test Spec: View Available Timeslots
 *
 * Based on TC-1.2 from e2e-checkout-test-plan.md
 * Verifies available timeslots are displayed in the booking panel
 */

export default {
	goal: "Verify available timeslots are displayed correctly in the booking panel",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to event detail page",
		"Verify date selection buttons are visible (up to 7 dates)",
		"Verify available time slots are displayed for the selected date",
		"Verify time slots show start and end times",
		"Verify 'Book Event' button is visible",
	],

	successCriteria: [
		"Date buttons are visible and clickable",
		"Time slots display with start and end times",
		"'Book Event' button is visible",
		"Booking panel shows price information (Free or $X)",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have at least one available timeslot",
		],
		tags: ["event-detail", "timeslots", "ui"],
	},
};
