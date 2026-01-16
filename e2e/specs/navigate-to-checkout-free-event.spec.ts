/**
 * Test Spec: Navigate to Checkout (Free Event)
 *
 * Based on TC-2.1 from e2e-checkout-test-plan.md
 * Verifies navigation to checkout page for free event
 */

export default {
	goal: "Verify navigation to checkout page for free event with correct URL parameters",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to free event detail page",
		"Select a date",
		"Select an available timeslot",
		"Click 'Book Event' button",
		"Verify URL redirects to checkout page with correct query parameters",
		"Verify checkout page loads successfully",
		"Verify booking summary displays correct event and timeslot information",
		"Verify customer info form is present",
	],

	successCriteria: [
		"URL contains /checkout path",
		"URL contains eventId query parameter",
		"URL contains dtstart and dtend query parameters",
		"Checkout page loads successfully",
		"Booking summary displays event information",
		"Customer info form is visible",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured",
		],
		tags: ["checkout", "navigation", "free-event"],
	},
};
