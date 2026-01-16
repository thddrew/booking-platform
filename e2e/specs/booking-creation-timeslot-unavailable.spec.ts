/**
 * Test Spec: Booking Creation - Timeslot No Longer Available
 *
 * Based on TC-5.4 from e2e-checkout-test-plan.md
 * Verifies handling when timeslot becomes unavailable during checkout
 */

export default {
	goal: "Verify appropriate error handling when timeslot becomes unavailable during checkout",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to checkout page",
		"Note the selected timeslot",
		"Simulate timeslot becoming fully booked (or wait if test data allows)",
		"Fill in customer information form",
		"Submit form",
		"Verify appropriate error message is displayed",
		"Verify user is informed timeslot is no longer available",
		"Verify option to return to event page is provided",
	],

	successCriteria: [
		"Error message displays when timeslot is unavailable",
		"Error message informs user timeslot is no longer available",
		"User is provided option to return to event page",
		"User can select different timeslot",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have timeslots that can become unavailable",
			"Event must have at least one valid price option configured",
		],
		tags: ["checkout", "error-state", "timeslots", "edge-case"],
	},
};
