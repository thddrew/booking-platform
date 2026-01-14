import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 */
export default defineConfig({
	// Test directory
	testDir: './e2e/specs',
	
	// Base URL for tests (can be overridden via BASE_URL env var)
	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:4000',
		// Take screenshot on failure
		screenshot: 'only-on-failure',
		// Record video on failure
		video: 'retain-on-failure',
		// Trace on failure
		trace: 'retain-on-failure',
		// Timeout for each action
		actionTimeout: 10000,
		// Navigation timeout
		navigationTimeout: 30000,
	},
	
	// Test timeout (3 minutes per test)
	timeout: 180000,
	
	// Expect timeout
	expect: {
		timeout: 10000,
	},
	
	// Run tests in parallel (disabled for now - orchestrator manages this)
	workers: 1,
	
	// Retry failed tests (disabled - orchestrator handles retries with LLM)
	retries: 0,
	
	// Reporter configuration
	reporter: [
		['list'], // Console reporter
		['json', { outputFile: 'e2e/test-results/results.json' }],
		['html', { outputFolder: 'e2e/test-results/html-report' }],
	],
	
	// Output directory for test artifacts
	outputDir: 'e2e/test-results/artifacts',
	
	// Global setup/teardown (if needed)
	// globalSetup: './e2e/global-setup.ts',
	// globalTeardown: './e2e/global-teardown.ts',
	
	// Projects for different browsers (using Chromium for now)
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
			},
		},
	],
});
