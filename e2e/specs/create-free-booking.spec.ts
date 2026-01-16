/**
 * Test Spec: Create Free Event Booking
 *
 * Based on TC-4.1 from e2e-checkout-test-plan.md
 * Tests the complete flow of creating a free event booking as a guest user
 */

export default {
	goal: "Create a free event booking as a guest user",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to free event detail page",
		"Select first available timeslot",
		"Click Book Event button to navigate to checkout",
		"Fill customer information form (firstName: John, lastName: Doe, email: john.doe@example.com)",
		"Submit checkout form",
		"Verify redirect to success page",
	],

	successCriteria: [
		"URL contains /checkout/success",
		"Page displays 'Booking Confirmed' or similar success message",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured (even for $0, requires stripePriceId)",
		],
		tags: ["checkout", "guest-user", "free-booking", "smoke"],
	},
};
