/**
 * Test Spec: Success Page - Missing Booking ID
 *
 * Based on TC-7.3 from e2e-checkout-test-plan.md
 * Verifies handling of missing booking ID parameter
 */

export default {
	goal: "Verify success page handles missing booking ID parameter correctly",

	startUrl: "/tenant-slugs/gold/checkout/success",

	steps: [
		"Navigate to success page without bookingId parameter",
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
