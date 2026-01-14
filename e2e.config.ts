/**
 * E2E Test Orchestrator Configuration
 */
export interface E2EConfig {
	specsDir: string;
	maxWorkers: number;
	maxSteps: number; // Max LLM debugging steps per test failure
	maxRetries: number; // Max test retries (after applying fix)
	timeout: number;
	reportDir: string;
	playwrightConfig: string;
	baseUrl: string;
	healthCheckEndpoint: string;
	waitForApp: boolean;
	saveLlmLogs: boolean; // Save LLM prompts/responses to files for analysis
}

function getBaseUrl(): string {
	// Check if running in Docker container
	const isDocker = process.env.DOCKER === 'true' || 
	                 (typeof process !== 'undefined' && process.env.CI === 'true');
	
	if (isDocker) {
		if (process.platform === 'linux') {
			// Linux: Use host IP or service name
			return process.env.BASE_URL || process.env.HOST_URL || 'http://172.17.0.1:4000';
		} else {
			// Mac/Windows Docker Desktop
			return process.env.BASE_URL || 'http://host.docker.internal:4000';
		}
	}
	
	// Not in container - use localhost
	return process.env.BASE_URL || 'http://localhost:4000';
}

const config: E2EConfig = {
	specsDir: process.env.E2E_SPECS_DIR || 'e2e/specs',
	maxWorkers: parseInt(process.env.MAX_WORKERS || '5', 10),
	maxSteps: parseInt(process.env.MAX_STEPS || '20', 10), // Max LLM debugging steps
	maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10), // Max test retries
	timeout: parseInt(process.env.TIMEOUT || '180000', 10), // 3 minutes
	reportDir: process.env.E2E_REPORT_DIR || 'docs/e2e-test-results',
	playwrightConfig: process.env.PLAYWRIGHT_CONFIG || 'playwright.config.ts',
	baseUrl: getBaseUrl(),
	healthCheckEndpoint: process.env.HEALTH_CHECK_ENDPOINT || '/health',
	waitForApp: process.env.WAIT_FOR_APP !== 'false', // Default: true
	saveLlmLogs: process.env.SAVE_LLM_LOGS === 'true', // Default: false
};

export default config;
