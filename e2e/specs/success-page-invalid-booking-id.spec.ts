/**
 * Test Spec: Success Page - Invalid Booking ID
 *
 * Based on TC-7.5 from e2e-checkout-test-plan.md
 * Verifies handling of invalid/non-existent booking ID
 */

export default {
	goal: "Verify success page handles invalid booking ID correctly",

	startUrl: "/tenant-slugs/gold/checkout/success?bookingId=invalid-id-12345&email=test@example.com",

	steps: [
		"Navigate to success page with non-existent bookingId",
		"Verify page shows 404 or error message",
		"Verify user is informed booking not found",
	],

	successCriteria: [
		"Page shows 404 or error page",
		"Error message indicates booking not found",
		"No booking details are displayed",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
		],
		tags: ["success-page", "error-state", "validation"],
	},
};
