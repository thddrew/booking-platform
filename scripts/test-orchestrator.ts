#!/usr/bin/env bun

/**
 * Test Orchestrator
 * Spawns multiple workers to run test specs in parallel with LLM auto-fix
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { discoverSpecs, checkAppHealth, ensureReportDir, generateReportFilename } from './test-utils.js';
import { runWorker } from './test-worker.js';
import config from '../e2e.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
	spec: string;
	status: 'passed' | 'failed' | 'error';
	duration: number;
	steps: number; // Total debugging steps taken
	error?: string;
	fixes?: any[];
	debugInfo?: any;
}

interface OrchestratorResults {
	total: number;
	passed: number;
	passedWithoutFixes: number;
	passedWithFixes: number;
	failedFixed: number;
	earlyExit: number;
	failedUnfixable: number;
	results: TestResult[];
	executionTime: number;
	llmApiCalls: number;
	estimatedCost: number;
}

/**
 * Main orchestrator function
 */
async function main() {
	const startTime = Date.now();
	
	console.log('🎯 E2E Test Orchestrator');
	console.log('========================\n');
	
	// Check app health
	if (config.waitForApp) {
		console.log(`🔍 Checking app health at ${config.baseUrl}${config.healthCheckEndpoint}...`);
		const isHealthy = await checkAppHealth(config.baseUrl, config.healthCheckEndpoint);
		
		if (!isHealthy) {
			console.error(`❌ App is not accessible at ${config.baseUrl}`);
			console.error('Please ensure the app is running before running tests.');
			console.error(`\n💡 Tip: Start the app with: bun run dev`);
			process.exit(1);
		}
		
		console.log(`✅ App is accessible at ${config.baseUrl}\n`);
	}
	
	// Discover test specs
	console.log(`📋 Discovering test specs in ${config.specsDir}...`);
	const specs = await discoverSpecs(config.specsDir);
	
	if (specs.length === 0) {
		console.error(`❌ No test specs found in ${config.specsDir}`);
		console.error('Create test specs using the template: e2e/specs/.template.spec.ts');
		process.exit(1);
	}
	
	console.log(`✅ Found ${specs.length} test spec${specs.length > 1 ? 's' : ''}\n`);
	
	// Ensure report directory exists
	await ensureReportDir(config.reportDir);
	
	// Run tests with parallelization
	console.log(`🚀 Running tests with max ${config.maxWorkers} workers...\n`);
	const results = await runTestsWithParallelization(specs);
	
	// Generate report
	const executionTime = Date.now() - startTime;
	const report = generateReport(results, executionTime);
	
	const reportFilename = generateReportFilename('test-report');
	const reportPath = path.join(__dirname, '..', config.reportDir, reportFilename);
	
	await Bun.write(reportPath, report);
	
	console.log(`\n📊 Report saved to: ${reportPath}`);
	console.log('\n' + getSummary(results, executionTime));
	
	// Exit with appropriate code
	const hasFailures = results.failedFixed > 0 || results.failedUnfixable > 0;
	process.exit(hasFailures ? 1 : 0);
}

/**
 * Run tests with parallelization control
 */
async function runTestsWithParallelization(specs: string[]): Promise<OrchestratorResults> {
	const results: TestResult[] = [];
	const queue = [...specs];
	const activeWorkers: Promise<TestResult>[] = [];
	
	const allResults: TestResult[] = [];
	
	// Process queue
	while (queue.length > 0 || activeWorkers.length > 0) {
		// Spawn new workers up to max
		while (activeWorkers.length < config.maxWorkers && queue.length > 0) {
			const spec = queue.shift()!;
			const workerPromise = runWorker(spec);
			activeWorkers.push(workerPromise);
			
			workerPromise.then((result) => {
				allResults.push(result);
			});
		}
		
		// Wait for one worker to complete
		if (activeWorkers.length > 0) {
			const completed = await Promise.race(activeWorkers);
			activeWorkers.splice(activeWorkers.indexOf(completed), 1);
		}
	}
	
	// Calculate statistics
	const passed = allResults.filter((r) => r.status === 'passed');
	const passedWithoutFixes = passed.filter((r) => !r.fixes || r.fixes.length === 0);
	const passedWithFixes = passed.filter((r) => r.fixes && r.fixes.length > 0);
	const failedFixed = allResults.filter((r) => r.status === 'failed' && r.fixes && r.fixes.length > 0);
	const earlyExit = allResults.filter((r) => r.earlyExit);
	const failedUnfixable = allResults.filter((r) => r.status === 'failed' && (!r.fixes || r.fixes.length === 0) && !r.earlyExit);
	
	// Estimate LLM API calls (1 per debugging step, fewer for early exit)
	const llmApiCalls = allResults.reduce((sum, r) => {
		// Early exit tests use fewer steps, so count actual steps
		return sum + (r.steps || 0);
	}, 0);
	
	// Estimate cost (~$0.01-0.05 per LLM call)
	const estimatedCost = llmApiCalls * 0.02; // Average estimate
	
	return {
		total: allResults.length,
		passed: passed.length,
		passedWithoutFixes: passedWithoutFixes.length,
		passedWithFixes: passedWithFixes.length,
		failedFixed: failedFixed.length,
		earlyExit: earlyExit.length,
		failedUnfixable: failedUnfixable.length,
		results: allResults,
		executionTime: 0, // Will be set by caller
		llmApiCalls,
		estimatedCost,
	};
}

/**
 * Generate test report
 */
function generateReport(results: OrchestratorResults, executionTime: number): string {
	const timestamp = new Date().toISOString();
	const executionTimeSeconds = (executionTime / 1000).toFixed(2);
	const executionTimeMinutes = (executionTime / 60000).toFixed(2);
	
	let report = `# E2E Test Execution Report\n\n`;
	report += `Date: ${timestamp}\n`;
	report += `Execution Time: ${executionTimeSeconds}s (${executionTimeMinutes} minutes)\n\n`;
	
	const earlyExitCount = results.results.filter((r) => r.earlyExit).length;
	
	report += `## Summary\n\n`;
	report += `- Total Specs: ${results.total}\n`;
	report += `- Passed: ${results.passed} (${results.passedWithoutFixes} without fixes, ${results.passedWithFixes} with fixes)\n`;
	report += `- Failed (Fixed): ${results.failedFixed}\n`;
	report += `- Early Exit: ${earlyExitCount} (requires manual intervention)\n`;
	report += `- Failed (Unfixable): ${results.failedUnfixable}\n`;
	report += `- LLM API Calls: ${results.llmApiCalls}\n`;
	report += `- Estimated Cost: $${results.estimatedCost.toFixed(2)}\n\n`;
	
	// Test results
	report += `## Test Results\n\n`;
	
	for (const result of results.results) {
		const statusIcon = result.status === 'passed' ? '✅' : '❌';
		report += `### ${statusIcon} ${result.spec}\n\n`;
		report += `- Status: ${result.status}\n`;
		report += `- Duration: ${result.duration}ms\n`;
		report += `- Debugging Steps: ${result.steps}\n`;
		
		if (result.fixes && result.fixes.length > 0) {
			report += `- Fixes Applied: ${result.fixes.length}\n`;
		}
		
		if (result.error) {
			report += `- Error: ${result.error}\n`;
		}
		
		if (result.earlyExit) {
			report += `- Early Exit: ${result.earlyExit.category}\n`;
			report += `- Exit Reason: ${result.earlyExit.reason}\n`;
			report += `- Recommendation: ${result.earlyExit.recommendation}\n`;
			report += `- Exit Step: ${result.earlyExit.step}\n`;
		}
		
		report += `\n`;
	}
	
	// Proposed fixes
	const specsWithFixes = results.results.filter((r) => r.fixes && r.fixes.length > 0);
	if (specsWithFixes.length > 0) {
		report += `## Proposed Fixes\n\n`;
		
		for (const result of specsWithFixes) {
			report += `### ${result.spec}\n\n`;
			
			for (const fix of result.fixes || []) {
				report += `**Step ${fix.step}:**\n\n`;
				report += `**Original Code:**\n\`\`\`typescript\n${fix.originalCode}\n\`\`\`\n\n`;
				report += `**Proposed Fix:**\n\`\`\`typescript\n${fix.proposedFix}\n\`\`\`\n\n`;
				report += `**Strategy Change:** ${fix.strategyChange}\n\n`;
			}
		}
	}
	
	// Early exit tests
	const earlyExitTests = results.results.filter((r) => r.earlyExit);
	if (earlyExitTests.length > 0) {
		report += `## Early Exit Tests (Requires Manual Intervention)\n\n`;
		
		for (const result of earlyExitTests) {
			if (!result.earlyExit) continue;
			
			report += `### ${result.spec}\n\n`;
			report += `**Category:** ${result.earlyExit.category}\n`;
			report += `**Reason:** ${result.earlyExit.reason}\n`;
			report += `**Recommendation:** ${result.earlyExit.recommendation}\n`;
			report += `**Steps Taken:** ${result.earlyExit.step} (exited early)\n\n`;
			
			if (result.error) {
				report += `**Error:** ${result.error}\n\n`;
			}
		}
	}
	
	// Unfixable tests (no early exit, just couldn't fix)
	const unfixable = results.results.filter((r) => r.status === 'failed' && (!r.fixes || r.fixes.length === 0) && !r.earlyExit);
	if (unfixable.length > 0) {
		report += `## Unfixable Tests\n\n`;
		
		for (const result of unfixable) {
			report += `### ${result.spec}\n\n`;
			report += `**Error:** ${result.error || 'Unknown error'}\n\n`;
			
			if (result.debugInfo) {
				report += `**Debug Info:**\n`;
				report += `- URL: ${result.debugInfo.url}\n`;
				report += `- Title: ${result.debugInfo.title}\n`;
				report += `- Elements Found: ${result.debugInfo.availableElements?.length || 0}\n\n`;
			}
		}
	}
	
	return report;
}

/**
 * Get summary string
 */
function getSummary(results: OrchestratorResults, executionTime: number): string {
	const executionTimeSeconds = (executionTime / 1000).toFixed(2);
	
	let summary = '📊 Summary\n';
	summary += '==========\n\n';
	summary += `Total: ${results.total} | `;
	summary += `Passed: ${results.passed} | `;
	summary += `Failed: ${results.failedFixed + results.failedUnfixable}\n`;
	summary += `Execution Time: ${executionTimeSeconds}s\n`;
	summary += `LLM API Calls: ${results.llmApiCalls} | `;
	summary += `Estimated Cost: $${results.estimatedCost.toFixed(2)}\n`;
	
	return summary;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error('Orchestrator error:', error);
		process.exit(1);
	});
}
