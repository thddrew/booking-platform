/**
 * Test Spec: Form Validation - First Name Required
 *
 * Based on TC-3.4 from e2e-checkout-test-plan.md
 * Verifies first name field is required
 */

export default {
	goal: "Verify first name field is required and shows validation error when empty",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to checkout page (select date and timeslot first)",
		"Fill in last name and email with valid values",
		"Leave first name field empty",
		"Attempt to submit form",
		"Verify form does not submit",
		"Verify error message: 'First name is required' or similar",
		"Verify other fields retain their values",
	],

	successCriteria: [
		"Form does not submit",
		"Validation error displays for first name field",
		"Error message indicates first name is required",
		"Last name and email values are retained",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured",
		],
		tags: ["checkout", "form-validation", "required-fields"],
	},
};
