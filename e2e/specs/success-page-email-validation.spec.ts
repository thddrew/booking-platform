/**
 * Test Spec: Success Page - Email Validation
 *
 * Based on TC-7.4 from e2e-checkout-test-plan.md
 * Verifies email validation for booking access control
 */

export default {
	goal: "Verify success page validates email matches booking email for access control",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Complete booking with email: 'user@example.com'",
		"Note the bookingId from success page",
		"Navigate to success page with different email: 'wrong@example.com'",
		"Verify access is denied",
		"Navigate to success page with correct email: 'user@example.com'",
		"Verify access is granted",
	],

	successCriteria: [
		"Success page with wrong email shows 404 or access denied",
		"Success page with correct email displays booking details",
		"Unauthorized access to booking confirmation is prevented",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured",
		],
		tags: ["success-page", "error-state", "security", "access-control"],
	},
};
