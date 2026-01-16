/**
 * Test Spec: Form Validation - Last Name Required
 *
 * Based on TC-3.5 from e2e-checkout-test-plan.md
 * Verifies last name field is required
 */

export default {
	goal: "Verify last name field is required and shows validation error when empty",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to checkout page (select date and timeslot first)",
		"Fill in first name and email with valid values",
		"Leave last name field empty",
		"Attempt to submit form",
		"Verify form does not submit",
		"Verify error message: 'Last name is required' or similar",
		"Verify other fields retain their values",
	],

	successCriteria: [
		"Form does not submit",
		"Validation error displays for last name field",
		"Error message indicates last name is required",
		"First name and email values are retained",
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
