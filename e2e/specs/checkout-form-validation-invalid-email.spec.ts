/**
 * Test Spec: Form Validation - Invalid Email Format
 *
 * Based on TC-3.3 from e2e-checkout-test-plan.md
 * Verifies email format validation
 */

export default {
	goal: "Verify email format validation rejects invalid emails and accepts valid ones",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to checkout page (select date and timeslot first)",
		"Fill in first name and last name with valid values",
		"Enter invalid email: 'invalid-email'",
		"Attempt to submit form",
		"Verify validation error for email",
		"Enter another invalid email: '@example.com'",
		"Verify validation error",
		"Enter valid email: 'user@example.com'",
		"Verify email is accepted",
	],

	successCriteria: [
		"Form does not submit with invalid email formats",
		"Error message displays: 'Invalid email address' or similar",
		"Valid email formats are accepted",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured",
		],
		tags: ["checkout", "form-validation", "email"],
	},
};
