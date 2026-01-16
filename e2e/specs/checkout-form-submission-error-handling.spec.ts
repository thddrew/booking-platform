/**
 * Test Spec: Form Submission - Error Handling
 *
 * Based on TC-3.8 from e2e-checkout-test-plan.md
 * Verifies error handling for failed form submissions
 */

export default {
	goal: "Verify error handling displays user-friendly messages when form submission fails",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to checkout page (select date and timeslot first)",
		"Fill in all required fields with valid data",
		"Simulate server error (e.g., navigate to checkout with invalid eventId in URL)",
		"Attempt to submit form",
		"Verify error message displays in form",
		"Verify error is user-friendly and actionable",
		"Verify form remains accessible for retry",
		"Verify user can correct and resubmit",
	],

	successCriteria: [
		"Error message displays in form when submission fails",
		"Error message is user-friendly (not technical)",
		"Error message suggests how to fix the issue",
		"Form remains accessible for retry",
		"User can correct information and resubmit",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured",
		],
		tags: ["checkout", "error-state", "form-submission"],
	},
};
