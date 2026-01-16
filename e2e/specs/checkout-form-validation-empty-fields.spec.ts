/**
 * Test Spec: Form Validation - Empty Required Fields
 *
 * Based on TC-3.2 from e2e-checkout-test-plan.md
 * Verifies validation for required fields when left empty
 */

export default {
	goal: "Verify form validation prevents submission when required fields are empty",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to checkout page (select date and timeslot first)",
		"Leave all form fields empty",
		"Click submit button",
		"Verify form does not submit",
		"Verify validation errors display for required fields",
	],

	successCriteria: [
		"Form does not submit",
		"Validation error displays for first name field",
		"Validation error displays for last name field",
		"Validation error displays for email field",
		"Error messages are clear and actionable",
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
