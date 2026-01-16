/**
 * Test Spec: Create Free Booking Without Phone
 *
 * Based on TC-4.2 from e2e-checkout-test-plan.md
 * Verifies booking creation without optional phone field
 */

export default {
	goal: "Verify free event booking can be created without providing phone number",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to free event checkout page",
		"Fill in required fields only (firstName: John, lastName: Doe, email: john.doe@example.com)",
		"Leave phone field empty",
		"Submit form",
		"Verify redirect to success page",
	],

	successCriteria: [
		"Form submits successfully without phone number",
		"URL contains /checkout/success",
		"Success page displays booking confirmation",
		"No validation error for phone field",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured",
		],
		tags: ["checkout", "guest-user", "free-booking", "optional-fields"],
	},
};
