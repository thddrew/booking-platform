/**
 * Test Spec Template
 *
 * Copy this file and customize it for your test spec.
 * Follow the structure and fill in the required fields.
 */

export default {
  /**
   * Goal: Clear, concise description of the test objective
   * Example: "Create a free event booking as a guest user"
   */
  goal: "DESCRIBE_TEST_GOAL_HERE",

  /**
   * Steps: Human-readable list of test steps
   * Used by LLM to understand test flow
   */
  steps: [
    "Step 1: Describe the first action",
    "Step 2: Describe the second action",
    "Step 3: Describe verification step",
    // Add more steps as needed
  ],

  /**
   * Code: Playwright test code implementing the happy path
   * - Should be executable Playwright test code
   * - Include comments for clarity
   * - Use data-testid attributes when possible
   * - Include assertions
   */
  code: `
    import { test, expect } from '@playwright/test';
    
    test('TEST_NAME_HERE', async ({ page }) => {
      // Step 1: Navigate to page
      await page.goto('/path/to/page');
      
      // Step 2: Perform action
      await page.click('[data-testid="element-id"]');
      
      // Step 3: Verify result
      await expect(page.locator('[data-testid="result"]')).toBeVisible();
    });
  `,

  /**
   * Assertions: List of expected outcomes
   * Used by LLM to understand what success looks like
   */
  assertions: [
    "Assertion 1: Describe expected outcome",
    "Assertion 2: Describe another expected outcome",
    // Add more assertions as needed
  ],

  /**
   * Metadata: Optional test metadata
   */
  metadata: {
    /**
     * Dependencies: Tests that must run before this test
     * Only use if absolutely necessary (reduces parallelization)
     * Prefer combining dependent tests into single spec
     */
    dependencies: [] as string[], // e.g., ['setup-user.spec.ts']

    /**
     * Prerequisites: Conditions that must be met before test runs
     * Example: "Database must have test event seeded"
     */
    prerequisites: [] as string[],

    /**
     * Tags: Test categorization
     * Example: ['checkout', 'guest-user', 'free-booking']
     */
    tags: [] as string[],

    /**
     * Timeout: Custom timeout for this spec (in milliseconds)
     * Overrides global timeout (3 minutes) if set
     */
    timeout: undefined as number | undefined,

    /**
     * Retries: Custom retry count for this spec
     * Overrides global maxRetries (3) if set
     */
    retries: undefined as number | undefined,
  },
};
