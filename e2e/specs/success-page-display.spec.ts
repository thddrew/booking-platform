/**
 * Test Spec: Display Success Page - Free Event
 *
 * Based on TC-7.1 from e2e-checkout-test-plan.md
 * Verifies success page displays correctly for free event booking
 */

export default {
	goal: "Verify success page displays all booking details correctly for free event",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Complete free event booking (select timeslot, fill form, submit)",
		"Verify success page displays success icon/indicator",
		"Verify 'Booking Confirmed!' or similar heading is displayed",
		"Verify booking details card shows event information",
		"Verify date and time are displayed correctly",
		"Verify customer information is displayed",
		"Verify booking reference (ID) is displayed",
		"Verify 'Browse More Events' button is present",
	],

	successCriteria: [
		"Success page displays success indicator",
		"'Booking Confirmed!' or similar heading is visible",
		"Event information (title) is displayed",
		"Date and time match selected timeslot",
		"Customer name and email are displayed",
		"Booking ID/reference is visible",
		"'Browse More Events' button is present",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have available timeslots",
			"Event must have at least one valid price option configured",
		],
		tags: ["success-page", "free-booking", "ui"],
	},
};
