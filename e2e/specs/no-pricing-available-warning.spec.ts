/**
 * Test Spec: No Pricing Available Warning
 *
 * Verifies that events without valid pricing options show appropriate warning
 * and disable the Book Event button
 */

export default {
	goal: "Verify events without valid pricing options display warning and disable booking",

	startUrl: "/tenant-slugs/gold/events/free-event",

	steps: [
		"Navigate to event detail page",
		"Verify 'No pricing available' alert is displayed",
		"Verify alert shows title: 'No pricing available'",
		"Verify alert shows description: 'This event does not have any valid pricing options configured.'",
		"Verify 'Book Event' button is disabled",
		"Attempt to click 'Book Event' button",
		"Verify button click does not navigate",
	],

	successCriteria: [
		"'No pricing available' alert is visible",
		"Alert title matches 'No pricing available'",
		"Alert description mentions 'valid pricing options configured'",
		"'Book Event' button is disabled",
		"Button click does not trigger navigation",
	],

	metadata: {
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event must have NO valid pricing options (no prices or all prices missing stripePriceId)",
		],
		tags: ["event-detail", "error-state", "pricing", "validation"],
	},
};
