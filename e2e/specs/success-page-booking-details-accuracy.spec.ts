/**
 * Test Spec: Success Page - Booking Details Accuracy
 *
 * Based on TC-7.6 from e2e-checkout-test-plan.md
 * Verifies booking details displayed on success page are accurate
 */

export default {
	goal: "Verify all booking details displayed on success page match the submitted data",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Complete booking with known test data (firstName: Jane, lastName: Smith, email: jane.smith@example.com)",
		"Note the selected date and timeslot",
		"Submit form and navigate to success page",
		"Verify event title matches",
		"Verify date and time match selected timeslot",
		"Verify customer name matches form input (Jane Smith)",
		"Verify email matches form input (jane.smith@example.com)",
		"Verify booking ID is displayed and is a valid format",
	],

	successCriteria: [
		"Event title matches the event",
		"Date and time match selected timeslot",
		"Customer name matches form input",
		"Email matches form input",
		"Booking ID is displayed and valid",
		"All displayed data is accurate",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured",
		],
		tags: ["success-page", "data-integrity", "verification"],
	},
};
