/**
 * Test Spec: URL Parameters Validation
 *
 * Based on TC-2.4 from e2e-checkout-test-plan.md
 * Verifies checkout page handles missing/invalid URL parameters gracefully
 */

export default {
	goal: "Verify checkout page handles missing or invalid URL parameters gracefully",

	startUrl: "/tenant-slugs/gold/checkout",

	steps: [
		"Navigate directly to checkout page without required parameters",
		"Verify page shows appropriate error message or redirects",
		"Navigate to checkout with invalid eventId parameter",
		"Verify error handling for invalid event",
		"Navigate to checkout with invalid date format",
		"Verify error handling for malformed dates",
	],

	successCriteria: [
		"Page shows appropriate error message or redirects when parameters are missing",
		"Invalid eventId is handled gracefully",
		"Invalid date format is handled gracefully",
		"User is not shown incorrect booking information",
		"No crashes or unhandled errors occur",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
		],
		tags: ["checkout", "error-state", "validation", "edge-case"],
	},
};
