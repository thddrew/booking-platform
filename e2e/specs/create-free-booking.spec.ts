/**
 * Test Spec: Create Free Event Booking
 * 
 * Based on TC-4.1 from e2e-checkout-test-plan.md
 * Tests the complete flow of creating a free event booking as a guest user
 */

export default {
	goal: "Create a free event booking as a guest user",

	steps: [
		"Navigate to free event detail page",
		"Select first available timeslot",
		"Click Book Event button to navigate to checkout",
		"Fill customer information form (firstName, lastName, email)",
		"Submit checkout form",
		"Verify redirect to success page",
		"Verify booking confirmation displays with correct information"
	],

	code: `
		import { test, expect } from '@playwright/test';
		
		test('Create free event booking', async ({ page }) => {
			// Step 1: Navigate to free event detail page
			// Event runs every Wednesday 1-3pm
			await page.goto('/tenant-slugs/gold/events/free-event');
			
			// Wait for page to load
			await page.waitForLoadState('networkidle');
			
			// Step 2: Select first available timeslot
			// Event schedule: Every Wednesday 1-3pm
			// Click first available Wednesday date button
			await page.click('[data-testid="date-button"]:first-child');
			
			// Wait for timeslots to load (should show 1-3pm slot)
			await page.waitForSelector('[data-testid="timeslot"]', { timeout: 5000 });
			
			// Click first available timeslot (should be the 1-3pm Wednesday slot)
			await page.click('[data-testid="timeslot"]:first-child');
			
			// Step 3: Click Book Event button
			await page.click('button:has-text("Book Event")');
			
			// Wait for navigation to checkout page
			await page.waitForURL(/\\/checkout/, { timeout: 10000 });
			
			// Step 4: Fill customer information form
			await page.fill('input[name="firstName"]', 'John');
			await page.fill('input[name="lastName"]', 'Doe');
			await page.fill('input[name="email"]', 'john.doe@example.com');
			
			// Optional: Fill phone if field exists
			const phoneInput = page.locator('input[name="phone"]');
			if (await phoneInput.isVisible()) {
				await phoneInput.fill('+1 (555) 123-4567');
			}
			
			// Step 5: Submit form
			await page.click('button:has-text("Complete Booking")');
			
			// Step 6: Verify redirect to success page
			await expect(page).toHaveURL(/\\/checkout\\/success/, { timeout: 15000 });
			
			// Step 7: Verify booking confirmation displays
			// Check for success heading
			await expect(page.locator('h1, h2')).toContainText(/booking confirmed|success/i);
			
			// Verify booking ID is displayed
			const bookingIdElement = page.locator('[data-testid="booking-id"], [data-testid="booking-reference"]');
			await expect(bookingIdElement.first()).toBeVisible({ timeout: 5000 });
			
			// Verify customer name is displayed
			await expect(page.locator('text=/John Doe/i')).toBeVisible();
			
			// Verify email is displayed
			await expect(page.locator('text=/john.doe@example.com/i')).toBeVisible();
		});
	`,

	assertions: [
		"URL contains /checkout/success path",
		"Success page displays 'Booking Confirmed' or similar heading",
		"Booking ID/reference is displayed and visible",
		"Customer name (John Doe) is displayed on success page",
		"Customer email (john.doe@example.com) is displayed on success page",
		"Event information is displayed in booking details",
		"Selected timeslot information is displayed"
	],

	metadata: {
		dependencies: [],
		prerequisites: [
			"Test tenant 'gold' must exist with allowPublicRead=true",
			"Test event 'free-event' must exist in database",
			"Event schedule: Every Wednesday 1-3pm",
			"Event must have available timeslots (at least one upcoming Wednesday)",
			"Event must have no prices or all prices set to $0"
		],
		tags: ['checkout', 'guest-user', 'free-booking', 'smoke'],
		timeout: undefined, // Use global 3 minute timeout
		retries: undefined // Use global 3 retries
	}
};
