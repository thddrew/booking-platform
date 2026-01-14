#!/usr/bin/env bun

/**
 * Test Worker
 * Runs a single test spec with Playwright and LLM auto-fix
 */

import { chromium, type Page } from 'playwright';
import { expect } from '@playwright/test';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { loadSpec, type TestSpec } from './test-utils.js';
import config from '../e2e.config.js';
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

interface TestResult {
	spec: string;
	status: 'passed' | 'failed' | 'error';
	duration: number;
	steps: number;
	error?: string;
	debugInfo?: DebugInfo;
	earlyExit?: {
		category: 'environment' | 'infrastructure' | 'data' | 'architectural' | 'non-fixable';
		reason: string;
		recommendation: string;
		step: number; // Which step detected early exit
	};
}

interface DebuggingStep {
	step: number;
	action: string;
	observation?: string;
	reasoning?: string;
}

interface DebugInfo {
	url: string;
	title: string;
	domSnapshot: string;
	availableElements: any[];
	consoleLogs: string[];
	networkFailures: string[];
	stackTrace: string;
}

interface PageContext {
	page: Page;
	consoleMessages: string[];
	networkFailures: string[];
}

/**
 * Check if test code is a placeholder (needs discovery)
 */
function isPlaceholderCode(code: string): boolean {
	const normalized = code.trim().toLowerCase();
	// Check if code is minimal - just navigation and maybe a comment
	const hasOnlyNavigation = /page\.goto\([^)]+\)/.test(code) && 
	                          !/page\.(click|fill|select|check|waitFor|expect)/.test(code);
	// Check if it's just a template/placeholder
	const isTemplate = normalized.includes('test_name_here') || 
	                   normalized.includes('describe_test_goal') ||
	                   normalized.includes('placeholder');
	return hasOnlyNavigation || isTemplate;
}

/**
 * Run discovery mode: navigate to page, capture DOM, generate test code
 */
async function runDiscoveryMode(spec: TestSpec, specPath: string): Promise<string | null> {
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		baseURL: config.baseUrl,
	});
	const page = await context.newPage();
	
	try {
		// Extract URL from code or steps
		const urlMatch = spec.code.match(/page\.goto\(['"]([^'"]+)['"]\)/);
		if (!urlMatch) {
			console.log(`  ⚠️  Could not extract URL from test code for discovery`);
			return null;
		}
		
		const targetUrl = urlMatch[1];
		console.log(`  📍 Navigating to: ${targetUrl}`);
		
		await page.goto(targetUrl);
		await page.waitForLoadState('networkidle');
		
		// Capture DOM and elements
		const debugInfo = await collectDebugInfo({ page, consoleMessages: [], networkFailures: [] }, new Error('Discovery mode'));
		
		// Generate test code using LLM
		const generatedCode = await generateTestCodeFromDOM(spec, debugInfo);
		
		if (generatedCode) {
			// Save generated code back to spec file
			await saveGeneratedCodeToSpec(specPath, generatedCode);
			return generatedCode;
		}
		
		return null;
	} catch (error) {
		console.error(`  ❌ Discovery mode failed: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	} finally {
		await browser.close();
	}
}

/**
 * Generate test code from DOM using LLM
 */
async function generateTestCodeFromDOM(spec: TestSpec, debugInfo: DebugInfo): Promise<string | null> {
	const discoveryDir = path.join(__dirname, '..', 'e2e', 'debug', 'discovery', Date.now().toString());
	await fs.mkdir(discoveryDir, { recursive: true });
	
	// Save debug files for LLM
	await Promise.all([
		fs.writeFile(path.join(discoveryDir, 'dom.html'), debugInfo.domSnapshot),
		fs.writeFile(path.join(discoveryDir, 'elements.json'), JSON.stringify(debugInfo.availableElements, null, 2)),
		fs.writeFile(path.join(discoveryDir, 'console.log'), debugInfo.consoleLogs.join('\n')),
	]);
	
	const prompt = buildDiscoveryPrompt(spec, debugInfo, discoveryDir);
	
	try {
		const response = await callCursorAgent(prompt, discoveryDir);
		if (!response) {
			return null;
		}
		
		// Parse agent response (may be wrapped in { result: ... })
		let parsed: any;
		try {
			parsed = JSON.parse(response);
			// Agent may wrap response in { result: ... }
			if (parsed.result) {
				parsed = typeof parsed.result === 'string' ? JSON.parse(parsed.result) : parsed.result;
			}
		} catch {
			// If parsing fails, try to extract JSON from response
			const jsonMatch = response.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				parsed = JSON.parse(jsonMatch[0]);
			} else {
				throw new Error('Could not parse JSON from agent response');
			}
		}
		
		if (parsed.generatedCode) {
			return parsed.generatedCode;
		}
		
		return null;
	} catch (error) {
		console.error(`  ❌ Failed to generate test code: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	}
}

/**
 * Build prompt for discovery mode
 */
function buildDiscoveryPrompt(spec: TestSpec, debugInfo: DebugInfo, debugDir: string): string {
	const elementsSummary = debugInfo.availableElements
		.slice(0, 50)
		.map(el => `${el.tag}${el.text ? `: "${el.text.substring(0, 50)}"` : ''}${el.class ? ` [${el.class.substring(0, 30)}]` : ''}`)
		.join('\n');
	
	return `You are helping generate Playwright test code for a new test spec.

**Test Goal:** ${spec.goal}

**Test Steps:**
${spec.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Expected Assertions:**
${spec.assertions.map(a => `- ${a}`).join('\n')}

**Current Page State:**
- URL: ${debugInfo.url}
- Title: ${debugInfo.title}
- Available Elements (sample):
${elementsSummary}

**Debug Files Available (relative to current directory):**
- dom.html - Full DOM snapshot
- elements.json - All available elements with attributes
- console.log - Browser console messages

**IMPORTANT - Selector Guidelines:**
- DO NOT use data-testid attributes in selectors - not all components are controlled by us and may not have test IDs
- Prefer using text-based selectors (e.g., \`button:has-text("Book Event")\`), role-based selectors, or class-based selectors
- Use element text content, labels, or visible attributes that are stable and unlikely to change
- If you must use attributes, prefer standard HTML attributes like \`id\`, \`name\`, \`role\`, or stable \`class\` names
- Check elements.json to see what attributes are actually available on elements

**Task:**
Generate complete Playwright test code that:
1. Navigates to the page (URL: ${debugInfo.url})
2. Implements all test steps using appropriate selectors based on the actual DOM structure
3. Includes all expected assertions
4. Uses proper waits and error handling
5. Follows Playwright best practices

**Response Format:**
Return ONLY a valid JSON object:
{
  "generatedCode": "string - complete Playwright test code (can include newlines, use \\n for newlines)"
}

CRITICAL:
- Return ONLY the JSON object, nothing else
- No markdown formatting (no code blocks with backticks)
- The generatedCode should be valid TypeScript/JavaScript
- Use \\n for newlines in the JSON string
- All code must be properly escaped for JSON`;
}

/**
 * Save generated code back to spec file
 */
async function saveGeneratedCodeToSpec(specPath: string, generatedCode: string): Promise<void> {
	try {
		const specContent = await fs.readFile(specPath, 'utf-8');
		
		// Find the code block and replace it
		const codeBlockRegex = /code:\s*`([\s\S]*?)`/;
		const newContent = specContent.replace(codeBlockRegex, `code: \`${generatedCode}\``);
		
		await fs.writeFile(specPath, newContent, 'utf-8');
		console.log(`  💾 Generated code saved to ${specPath}`);
	} catch (error) {
		console.error(`  ❌ Failed to save generated code: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Main worker function
 */
export async function runWorker(specPath: string): Promise<TestResult> {
	const startTime = Date.now();
	const specName = path.basename(specPath, '.spec.ts');
	
	console.log(`\n🚀 Starting test: ${specName}`);
	
	const spec = await loadSpec(specPath);
	
	// Check if spec needs discovery mode (placeholder code or explicit flag)
	const needsDiscovery = spec.metadata?.discovery === true || isPlaceholderCode(spec.code);
	
	if (needsDiscovery) {
		console.log(`  🔍 Discovery mode: Generating test code from DOM structure...`);
		const generatedCode = await runDiscoveryMode(spec, specPath);
		if (generatedCode) {
			// Update spec with generated code
			spec.code = generatedCode;
			console.log(`  ✅ Test code generated and saved to spec file`);
		} else {
			console.log(`  ⚠️  Discovery mode failed, continuing with original code`);
		}
	}
	
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		baseURL: config.baseUrl,
	});
	const page = await context.newPage();
	
	// Track console messages and network failures
	const consoleMessages: string[] = [];
	const networkFailures: string[] = [];
	
	page.on('console', (msg) => {
		consoleMessages.push(`${msg.type()}: ${msg.text()}`);
	});
	
	page.on('requestfailed', (request) => {
		networkFailures.push(
			`${request.method()} ${request.url()}: ${request.failure()?.errorText}`
		);
	});
	
	const pageContext: PageContext = { page, consoleMessages, networkFailures };
	let currentCode = spec.code;
	let totalSteps = 0;
	
	// Outer loop: Test retries
	for (let retry = 1; retry <= config.maxRetries; retry++) {
		try {
			if (retry > 1) {
				console.log(`  ⚠️  Retry ${retry}/${config.maxRetries} (after applying fix)`);
			}
			
			// Run test with timeout
			const result = await runPlaywrightTest(currentCode, pageContext, config.timeout);
			
			if (result.success) {
				const duration = Date.now() - startTime;
				await browser.close();
				
				console.log(`  ✅ ${specName} passed (${duration}ms, ${totalSteps} step${totalSteps !== 1 ? 's' : ''}, ${retry} retr${retry > 1 ? 'ies' : 'y'})`);
				
				return {
					spec: specName,
					status: 'passed',
					duration,
					steps: totalSteps,
				};
			}
			
			// Test failed - allow LLM to take multiple debugging steps
			if (retry < config.maxRetries) {
				console.log(`  🔧 Test failed, starting LLM debugging process...`);
				
				const debugInfo = await collectDebugInfo(pageContext, result.error!);
				const baseDebugDir = path.join(
					__dirname,
					'..',
					'e2e',
					'debug',
					specName,
					`retry-${retry}-${Date.now()}`
				);
				await fs.mkdir(baseDebugDir, { recursive: true });
				
				// Save initial debug info directly to base directory
				await fs.mkdir(baseDebugDir, { recursive: true });
				await Promise.all([
					fs.writeFile(
						path.join(baseDebugDir, 'dom.html'),
						debugInfo.domSnapshot || '<html><body>No DOM available</body></html>'
					),
					fs.writeFile(
						path.join(baseDebugDir, 'elements.json'),
						JSON.stringify(debugInfo.availableElements, null, 2)
					),
					fs.writeFile(
						path.join(baseDebugDir, 'console.log'),
						debugInfo.consoleLogs.join('\n') || 'No console logs'
					),
					fs.writeFile(
						path.join(baseDebugDir, 'network.log'),
						debugInfo.networkFailures.join('\n') || 'No network failures'
					),
					fs.writeFile(
						path.join(baseDebugDir, 'error.txt'),
						`URL: ${debugInfo.url}\nTitle: ${debugInfo.title}\n\nStack Trace:\n${debugInfo.stackTrace}`
					),
				]);
				
				// Inner loop: Multiple LLM debugging steps
				const debuggingSteps: DebuggingStep[] = [];
				let stepCode = currentCode;
				
				for (let step = 1; step <= config.maxSteps; step++) {
					totalSteps++;
					const stepDebugDir = path.join(baseDebugDir, `step-${step}`);
					await fs.mkdir(stepDebugDir, { recursive: true });
					
					// Copy base debug files to step directory for agent access
					const debugFiles = ['dom.html', 'elements.json', 'error.txt', 'console.log', 'network.log'];
					for (const file of debugFiles) {
						try {
							await fs.copyFile(
								path.join(baseDebugDir, file),
								path.join(stepDebugDir, file)
							);
						} catch {
							// File might not exist, that's okay
						}
					}
					
					console.log(`  🔍 LLM Debugging Step ${step}/${config.maxSteps}...`);
					
					try {
						// Build context from previous steps
						const previousStepsContext = debuggingSteps.length > 0
							? `\n**Previous Debugging Steps:**\n${debuggingSteps.map(s => 
								`Step ${s.step}: ${s.action}${s.observation ? `\n  Observation: ${s.observation}` : ''}${s.reasoning ? `\n  Reasoning: ${s.reasoning}` : ''}`
							).join('\n\n')}\n`
							: '';
						
						const isFinalStep = step === config.maxSteps;
						
						// Write current code to a temp file so agent can read/modify it
						const tempCodeFile = path.join(stepDebugDir, 'test-code.ts');
						await fs.writeFile(tempCodeFile, stepCode, 'utf-8');
						
						// Call agent - let it decide what to do through tool calling
						const fixResult = await llmDebugStep(
							spec,
							result.error!,
							step,
							stepDebugDir,
							stepCode,
							previousStepsContext,
							isFinalStep,
							true // always allow file modifications
						);
						
						if (fixResult) {
							// Check for early exit first
							if (fixResult.earlyExit?.shouldExit) {
								// Early exit detected - stop debugging immediately
								console.log(`  🛑 Early exit triggered at step ${step}`);
								console.log(`  📋 Category: ${fixResult.earlyExit.category}`);
								console.log(`  📋 Reason: ${fixResult.earlyExit.reason}`);
								console.log(`  💡 Recommendation: ${fixResult.earlyExit.recommendation}`);
								
								// Mark test as failed with early exit
								await browser.close();
								const duration = Date.now() - startTime;
								
								return {
									spec: specName,
									status: 'failed',
									duration,
									steps: totalSteps,
									error: `Early exit: ${fixResult.earlyExit.reason}`,
									earlyExit: {
										category: fixResult.earlyExit.category,
										reason: fixResult.earlyExit.reason,
										recommendation: fixResult.earlyExit.recommendation,
										step: step,
									},
									debugInfo: debugInfo,
								};
							}
							
						// Agent may have modified the code file
						try {
							const originalCode = stepCode;
							const modifiedCode = await fs.readFile(tempCodeFile, 'utf-8');
							if (modifiedCode !== originalCode) {
								// File was modified - use it and rerun test immediately
								currentCode = modifiedCode;
								stepCode = modifiedCode;
								debuggingSteps.push({
									step,
									action: fixResult?.action || 'Agent fixed the code',
									reasoning: fixResult?.reasoning,
								});
								console.log(`  ✏️  Agent fixed the code after ${step} debugging step${step !== 1 ? 's' : ''}`);
								
								// Re-run test with updated code
								const testResult = await runPlaywrightTest(currentCode, pageContext, config.timeout);
								if (testResult.success) {
									const duration = Date.now() - startTime;
									await browser.close();
									console.log(`  ✅ ${specName} passed after fix (${duration}ms, ${totalSteps} step${totalSteps !== 1 ? 's' : ''}, ${retry} retr${retry > 1 ? 'ies' : 'y'})`);
									return {
										spec: specName,
										status: 'passed',
										duration,
										steps: totalSteps,
										debugInfo,
									};
								} else {
									console.log(`  ⚠️  Fix applied but test still fails, continuing to next retry...`);
									// Break out to move to next retry with updated code
									break;
								}
							} else if (isFinalStep) {
								// Final step but no modification
								console.log(`  ⚠️  Reached max steps (${config.maxSteps}) - agent did not modify code`);
								break;
							}
						} catch (readError) {
							console.error(`  ❌ Failed to read code file: ${readError instanceof Error ? readError.message : String(readError)}`);
						}
							
							// Intermediate step - refine understanding
							debuggingSteps.push({
								step,
								action: fixResult.action || 'Analyzed and refined understanding',
								observation: fixResult.observation,
								reasoning: fixResult.reasoning,
								...(fixResult.earlyExit ? { earlyExit: fixResult.earlyExit } : {}),
							} as any);
							console.log(`  📝 Step ${step} complete: ${fixResult.action || 'Analysis refined'}`);
						} else {
							console.log(`  ⚠️  Step ${step} did not produce output, continuing...`);
							if (isFinalStep) break;
						}
					} catch (stepError) {
						console.error(`  ❌ Step ${step} failed: ${stepError instanceof Error ? stepError.message : String(stepError)}`);
						break;
					}
				}
				
				// Check if early exit was detected during debugging
				// If so, we should have returned already, but double-check to prevent retries
				let detectedEarlyExit: { category: string; reason: string; recommendation: string; step: number } | null = null;
				for (const step of debuggingSteps) {
					if ((step as any).earlyExit?.shouldExit) {
						detectedEarlyExit = {
							category: (step as any).earlyExit.category,
							reason: (step as any).earlyExit.reason,
							recommendation: (step as any).earlyExit.recommendation,
							step: step.step,
						};
						break;
					}
				}
				
				// If early exit was detected, stop immediately - do not retry
				if (detectedEarlyExit) {
					console.log(`  🛑 Early exit detected - stopping retries`);
					console.log(`  📋 Category: ${detectedEarlyExit.category}`);
					console.log(`  📋 Reason: ${detectedEarlyExit.reason}`);
					console.log(`  💡 Recommendation: ${detectedEarlyExit.recommendation}`);
					
					await browser.close();
					const duration = Date.now() - startTime;
					
					return {
						spec: specName,
						status: 'failed',
						duration,
						steps: totalSteps,
						error: `Early exit: ${detectedEarlyExit.reason}`,
						earlyExit: detectedEarlyExit,
						debugInfo: debugInfo,
					};
				}
				// If no modification occurred across steps, continue to next retry
				if (!debuggingSteps.some((s) => s.action === 'Agent fixed the code')) {
					console.log(`  ⚠️  No fix produced after ${debuggingSteps.length} debugging step${debuggingSteps.length !== 1 ? 's' : ''}`);
				}
			}
		} catch (error) {
			if (retry === config.maxRetries) {
				// Max retries reached
				const debugInfo = await collectDebugInfo(pageContext, error as Error);
				await browser.close();
				const duration = Date.now() - startTime;
				
				console.log(`  ❌ ${specName} failed after ${retry} retr${retry > 1 ? 'ies' : 'y'} and ${totalSteps} debugging step${totalSteps !== 1 ? 's' : ''}`);
				
				return {
					spec: specName,
					status: 'failed',
					duration,
					steps: totalSteps,
					error: error instanceof Error ? error.message : String(error),
					debugInfo,
				};
			}
			
			// Error during test execution - try to debug
			const debugInfo = await collectDebugInfo(pageContext, error as Error);
			const baseDebugDir = path.join(
				__dirname,
				'..',
				'e2e',
				'debug',
				specName,
				`retry-${retry}-error-${Date.now()}`
			);
			await fs.mkdir(baseDebugDir, { recursive: true });
			
			// No automatic single-step fix; rely on main retry loop
		}
	}
	
	await browser.close();
	const duration = Date.now() - startTime;
	
	return {
		spec: specName,
		status: 'failed',
		duration,
		steps: totalSteps,
		error: 'Max retries exceeded',
	};
}

/**
 * Run Playwright test code
 * Writes test to temp file and executes using Playwright's test runner
 */
async function runPlaywrightTest(
	testCode: string,
	pageContext: PageContext,
	timeout: number
): Promise<{ success: boolean; error?: Error }> {
	const tempDir = path.join(__dirname, '..', 'e2e', '.temp');
	const tempTestFile = path.join(tempDir, 'test.spec.ts');
	
	try {
		// Ensure temp directory exists
		await fs.mkdir(tempDir, { recursive: true });
		
		// Prepare test code - ensure it has proper structure
		let testCodeToWrite = testCode.trim();
		
		// If code doesn't have imports, add them
		if (!testCodeToWrite.includes("import { test, expect }")) {
			testCodeToWrite = `import { test, expect } from '@playwright/test';\n\n${testCodeToWrite}`;
		}
		
		// Write to temp file
		await fs.writeFile(tempTestFile, testCodeToWrite);
		
		// Extract test body and execute directly
		// Parse the test code to extract the test function body
		const testBodyMatch = testCodeToWrite.match(/test\([^)]*\)\s*=>\s*\{([\s\S]*)\}\s*\);?/);
		
		if (!testBodyMatch) {
			throw new Error('Could not parse test code - missing test() wrapper');
		}
		
		const testBody = testBodyMatch[1];
		
		// Execute test body with page and expect in scope
		return new Promise(async (resolve) => {
			const timeoutId = setTimeout(() => {
				resolve({
					success: false,
					error: new Error(`Test timeout after ${timeout}ms`),
				});
			}, timeout);
			
			try {
				// Execute test body with page and expect available
				const page = pageContext.page;
				const { expect: expectFn } = await import('@playwright/test');
				
				// Create and execute test function
				const executeTest = new Function(
					'page',
					'expect',
					`
					return (async () => {
						${testBody}
					})();
				`
				);
				
				await executeTest(page, expectFn);
				
				clearTimeout(timeoutId);
				resolve({ success: true });
			} catch (error) {
				clearTimeout(timeoutId);
				resolve({
					success: false,
					error: error instanceof Error ? error : new Error(String(error)),
				});
			}
		});
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	} finally {
		// Clean up temp file
		try {
			await fs.unlink(tempTestFile).catch(() => {});
		} catch {
			// Ignore cleanup errors
		}
	}
}

/**
 * Collect debug information from page
 */
async function collectDebugInfo(pageContext: PageContext, error: Error): Promise<DebugInfo> {
	const page = pageContext.page;
	
	try {
		const url = page.url();
		const title = await page.title();
		// Capture only the body element to avoid _next tags and other unnecessary content
		const domSnapshot = await page.evaluate(() => {
			const body = document.body;
			return body ? body.outerHTML : '<body>No body available</body>';
		});
		
		const availableElements = await page.evaluate(() => {
			const elements: any[] = [];
			document
				.querySelectorAll('[data-testid], [id], [class], [role], button, a, input, select')
				.forEach((el) => {
					elements.push({
						tag: el.tagName,
						testId: el.getAttribute('data-testid'),
						id: el.getAttribute('id'),
						class: el.getAttribute('class'),
						role: el.getAttribute('role'),
						text: el.textContent?.trim().substring(0, 50),
						visible: el.offsetWidth > 0 && el.offsetHeight > 0,
					});
				});
			return elements;
		});
		
		return {
			url,
			title,
			domSnapshot,
			availableElements,
			consoleLogs: pageContext.consoleMessages || [],
			networkFailures: pageContext.networkFailures || [],
			stackTrace: error.stack || '',
		};
	} catch (e) {
		return {
			url: 'Page not available',
			title: 'Page crashed',
			domSnapshot: '',
			availableElements: [],
			consoleLogs: [],
			networkFailures: [],
			stackTrace: error.stack || '',
		};
	}
}

/**
 * Save debug information to files
 */
async function saveDebugInfo(debugInfo: DebugInfo, specPath: string, step: number): Promise<string> {
	const specName = path.basename(specPath, '.spec.ts');
	const timestamp = Date.now();
	const debugDir = path.join(
		__dirname,
		'..',
		'e2e',
		'debug',
		specName,
		`step-${step}-${timestamp}`
	);
	
	await fs.mkdir(debugDir, { recursive: true });
	
	await Promise.all([
		fs.writeFile(
			path.join(debugDir, 'dom.html'),
			debugInfo.domSnapshot || '<html><body>No DOM available</body></html>'
		),
		fs.writeFile(
			path.join(debugDir, 'elements.json'),
			JSON.stringify(debugInfo.availableElements, null, 2)
		),
		fs.writeFile(
			path.join(debugDir, 'console.log'),
			debugInfo.consoleLogs.join('\n') || 'No console logs'
		),
		fs.writeFile(
			path.join(debugDir, 'network.log'),
			debugInfo.networkFailures.join('\n') || 'No network failures'
		),
		fs.writeFile(
			path.join(debugDir, 'error.txt'),
			`URL: ${debugInfo.url}\nTitle: ${debugInfo.title}\n\nStack Trace:\n${debugInfo.stackTrace}`
		),
	]);
	
	return debugDir;
}

/**
 * LLM debugging step - agent decides what to do through tool calling
 */
async function llmDebugStep(
	spec: TestSpec,
	error: Error,
	step: number,
	debugDir: string,
	currentCode: string,
	previousStepsContext: string,
	isFinalStep: boolean,
	allowFileModifications: boolean = true
): Promise<{ 
	action?: string;
	observation?: string;
	reasoning?: string;
	status?: string;
	errorSummary?: string;
	isFinal: boolean;
	earlyExit?: {
		shouldExit: boolean;
		category: 'environment' | 'infrastructure' | 'data' | 'architectural' | 'non-fixable';
		reason: string;
		recommendation: string;
	};
} | null> {
	const cursorApiKey = process.env.CURSOR_API_KEY;
	
	if (!cursorApiKey) {
		console.warn('  ⚠️  CURSOR_API_KEY not set, skipping LLM step');
		return null;
	}
	
	try {
		const errorCategory = categorizeError(error);
		
		// Read debug files
		const elementsFile = path.join(debugDir, 'elements.json');
		const errorFile = path.join(debugDir, 'error.txt');
		
		let availableElements = '[]';
		let errorDetails = error.message;
		
		try {
			const elementsContent = await fs.readFile(elementsFile, 'utf-8');
			availableElements = elementsContent;
		} catch {
			// Elements file might not exist yet
		}
		
		try {
			const errorContent = await fs.readFile(errorFile, 'utf-8');
			errorDetails = errorContent;
		} catch {
			// Use error message if file doesn't exist
		}
		
		// Build prompt for this debugging step
		const prompt = buildDebugStepPrompt(
			spec,
			error,
			step,
			debugDir,
			currentCode,
			errorCategory,
			availableElements,
			errorDetails,
			previousStepsContext,
			isFinalStep,
			allowFileModifications
		);
		
		// Save prompt to file if logging is enabled
		if (config.saveLlmLogs) {
			const promptFile = path.join(debugDir, `llm-prompt-step-${step}.txt`);
			await fs.writeFile(promptFile, prompt);
		}
		
		// Call agent - it will use tools to read/modify files as needed
		const response = await callCursorAgent(prompt, debugDir);
		
		if (!response) {
			return null;
		}
		
		// Save response to file if logging is enabled
		if (config.saveLlmLogs) {
			const responseFile = path.join(debugDir, `llm-response-step-${step}.txt`);
			await fs.writeFile(responseFile, response);
		}
		
		// Parse response
		let parsedResult: any = null;
		
		// Parse response for early exit or status
		const parsed = parseDebugStepResponse(response);
		parsedResult = {
			...parsed,
			isFinal: isFinalStep,
		};
		
		// Save parsed result as JSON if logging is enabled
		if (config.saveLlmLogs && parsedResult) {
			const parsedFile = path.join(debugDir, `llm-parsed-step-${step}.json`);
			await fs.writeFile(parsedFile, JSON.stringify(parsedResult, null, 2));
		}
		
		return parsedResult;
	} catch (error) {
		console.error('  ❌ LLM debugging step failed:', error instanceof Error ? error.message : String(error));
		return null;
	}
}



/**
 * Categorize error type
 */
function categorizeError(error: Error): string {
	const message = error.message.toLowerCase();
	const stack = error.stack?.toLowerCase() || '';
	
	if (message.includes('element not found') || message.includes('selector') || message.includes('locate')) {
		return 'SelectorNotFound';
	}
	if (message.includes('timeout') || message.includes('navigation timeout')) {
		return 'TimingAsync';
	}
	if (message.includes('not visible') || message.includes('not enabled') || message.includes('not attached')) {
		return 'ElementState';
	}
	if (message.includes('navigation') || message.includes('page not loaded') || message.includes('invalid url')) {
		return 'Navigation';
	}
	if (message.includes('assertion') || message.includes('expected') || message.includes('but got')) {
		return 'Assertion';
	}
	if (message.includes('network') || message.includes('request failed') || message.includes('cors')) {
		return 'Network';
	}
	
	return 'LogicApplication';
}

/**
 * Build prompt for debugging step
 */
function buildDebugStepPrompt(
	spec: TestSpec,
	error: Error,
	step: number,
	debugDir: string,
	currentCode: string,
	errorCategory: string,
	availableElements: string,
	errorDetails: string,
	previousStepsContext: string,
	isFinalStep: boolean,
	allowFileModifications: boolean = true
): string {
	
		return `You are debugging a failing E2E test.

${previousStepsContext}

**Test Spec Goal:**
${spec.goal}

**Test Steps:**
${spec.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Error Information:**
- Category: ${errorCategory}
- Error: ${error.message}
- Debugging Step: ${step}${isFinalStep ? ' (FINAL)' : ' (INTERMEDIATE)'}
- Stack Trace:
${error.stack || 'No stack trace'}

**Debug Context:**
- Available elements: ${availableElements.substring(0, 2000)}${availableElements.length > 2000 ? '... (truncated)' : ''}
- Error details: ${errorDetails.substring(0, 500)}${errorDetails.length > 500 ? '...' : ''}

**Debug Files Available in this directory:**
- dom.html - Full DOM snapshot
- elements.json - Available selectable elements with attributes
- console.log - Browser console messages
- network.log - Failed network requests
- error.txt - Full error details
- test-code.ts - Current test code (if you need to fix it)

**Current Test Code:**
\`\`\`typescript
${currentCode}
\`\`\`

**Task:**
${allowFileModifications 
	? `Fix the failing test. Read the debug files to understand what went wrong, then modify test-code.ts to fix the issue. Make strategy-level changes, not just selector updates.`
	: `Analyze why the test failed. Read the debug files to understand the page state and document your findings. Return JSON with your analysis.`}

**IMPORTANT - Selector Guidelines:**
- DO NOT use data-testid attributes in selectors - not all components are controlled by us and may not have test IDs
- Prefer using text-based selectors (e.g., \`button:has-text("Book Event")\`), role-based selectors, or class-based selectors
- Use element text content, labels, or visible attributes that are stable and unlikely to change
- If you must use attributes, prefer standard HTML attributes like \`id\`, \`name\`, \`role\`, or stable \`class\` names
- Check elements.json to see what attributes are actually available on elements

**Early Exit Detection:**

If you determine that the failure is NOT fixable by test code changes, you can signal an early exit to stop debugging:

**Use early exit for:**
- Missing environment variables or API keys (e.g., STRIPE_SECRET_KEY not set)
- Database or infrastructure failures (e.g., database connection refused)
- Missing test data that requires manual seeding (e.g., event doesn't exist in database)
- Server-side crashes that require code changes outside the test (e.g., module initialization failures)
- Flaky tests that can't be fixed with code changes

**Do NOT use early exit for:**
- Test code issues (selector problems, timing issues) - these can be fixed
- Page rendering issues that can be fixed with better waits - these can be fixed
- Element interaction issues that can be fixed with strategy changes - these can be fixed

**Response Format (JSON only, no markdown):**
{
  "status": "pass" | "fail",
  "errorSummary": "string - brief summary of the remaining error after your changes (omit if status is pass)",
  "earlyExit": {
    "shouldExit": boolean,
    "category": "environment" | "infrastructure" | "data" | "architectural" | "non-fixable",
    "reason": "string",
    "recommendation": "string"
  }
}

Notes:
- Modify the code (test-code.ts or other relevant files) directly to fix the issue.
- Return JSON even if you already fixed the code (status should be pass in that case).
- Use earlyExit only when the issue cannot be fixed by code changes.

Now perform this debugging step.`;
}

/**
 * Build prompt for agent (legacy - kept for backward compatibility)
 */
function buildFixPrompt(
	spec: TestSpec,
	error: Error,
	step: number,
	debugDir: string,
	currentCode: string,
	errorCategory: string,
	availableElements: string,
	errorDetails: string
): string {
	return buildDebugStepPrompt(spec, error, step, debugDir, currentCode, errorCategory, availableElements, errorDetails, '', true);
}

/**
 * Call agent CLI (always with --force so it can modify files via tool calls)
 */
async function callCursorAgent(
	prompt: string, 
	workingDir: string
): Promise<string | null> {
	return new Promise((resolve, reject) => {
		const cursorApiKey = process.env.CURSOR_API_KEY;
		
		if (!cursorApiKey) {
			reject(new Error('CURSOR_API_KEY not set'));
			return;
		}
		
		console.log('  📤 Calling agent (prompt length: ' + prompt.length + ' chars)...');
		console.log(`  🔧 Agent can modify files (--force enabled)`);
		
		// Build agent command
		const agentArgs = ['--print', '--force', prompt];
		
		const agentProcess = spawn('agent', agentArgs, {
			cwd: workingDir,
			env: {
				...process.env,
				CURSOR_API_KEY: cursorApiKey,
			},
			stdio: ['ignore', 'pipe', 'pipe'], // Close stdin to avoid hanging
		});
		
		// Close stdin immediately to signal we're done sending input
		agentProcess.stdin?.end();
		
		let stdout = '';
		let stderr = '';
		let hasOutput = false;
		let lastOutputTime = Date.now();
		
		console.log('  ⏳ Waiting for agent response (PID: ' + agentProcess.pid + ')...');
		
		// Progress indicator
		const progressInterval = setInterval(() => {
			if (!hasOutput && Date.now() - lastOutputTime > 5000) {
				process.stdout.write('.');
				lastOutputTime = Date.now();
			}
		}, 5000);
		
		agentProcess.stdout.on('data', (data) => {
			if (!hasOutput) {
				console.log('\n  📥 Receiving response from agent...');
				hasOutput = true;
				clearInterval(progressInterval);
			}
			stdout += data.toString();
			process.stdout.write('.');
		});
		
		agentProcess.stderr.on('data', (data) => {
			const stderrText = data.toString();
			stderr += stderrText;
			// Log stderr for debugging
			if (stderrText.trim()) {
				console.error(`\n  ⚠️  Agent stderr: ${stderrText.substring(0, 300)}`);
			}
		});
		
		agentProcess.on('close', (code) => {
			clearInterval(progressInterval);
			if (hasOutput) {
				console.log(''); // New line after progress dots
			}
			if (code === 0 || stdout.trim()) {
				// Success or got output despite non-zero exit
				console.log('  ✅ Agent response received (' + stdout.length + ' chars)');
				resolve(stdout.trim());
			} else {
				console.error(`  ⚠️  agent exited with code ${code}`);
				if (stderr) {
					console.error(`  Error output: ${stderr.substring(0, 500)}`);
				}
				reject(new Error(`agent failed with code ${code}`));
			}
		});
		
		agentProcess.on('error', (error) => {
			// agent command not found
			if (error.message.includes('ENOENT') || (error as any).code === 'ENOENT') {
				console.error('  ❌ agent command not found');
				console.error('  💡 Install Cursor CLI: curl https://cursor.com/install -fsS | bash');
				console.error('  💡 Add ~/.local/bin to PATH: echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.zshrc');
				console.error('  💡 Verify: agent --version');
				reject(new Error('agent CLI not found. Install it or ensure it\'s in PATH'));
			} else {
				reject(error);
			}
		});
		
		// No timeout - let agent run until completion
		// Timeout removed to allow agent to take as long as needed
	});
}

/**
 * Parse debugging step response (for intermediate steps)
 */
function parseDebugStepResponse(response: string): { 
	action?: string; 
	observation?: string; 
	reasoning?: string;
	status?: string;
	errorSummary?: string;
	earlyExit?: {
		shouldExit: boolean;
		category: 'environment' | 'infrastructure' | 'data' | 'architectural' | 'non-fixable';
		reason: string;
		recommendation: string;
	};
} {
	try {
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0]);
			
			// Handle wrapped format
			let analysis = parsed;
			if (parsed.type === 'result' && parsed.result) {
				try {
					const innerResult = typeof parsed.result === 'string' 
						? JSON.parse(parsed.result) 
						: parsed.result;
					analysis = innerResult;
				} catch {
					const innerJsonMatch = parsed.result.match(/\{[\s\S]*\}/);
					if (innerJsonMatch) {
						analysis = JSON.parse(innerJsonMatch[0]);
					}
				}
			}
			
			return {
				action: analysis.action,
				observation: analysis.observation,
				reasoning: analysis.reasoning,
				earlyExit: analysis.earlyExit ? {
					shouldExit: analysis.earlyExit.shouldExit === true,
					category: analysis.earlyExit.category || 'non-fixable',
					reason: analysis.earlyExit.reason || '',
					recommendation: analysis.earlyExit.recommendation || '',
				} : undefined,
			};
		}
	} catch (error) {
		// Parsing failed
	}
	
	return {};
}


// If run directly, execute worker
if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);
	const enableLlmLogs = args.includes('--save-llm-logs');
	const specPath = args.find((arg) => !arg.startsWith('--'));
	
	if (!specPath) {
		console.error('Usage: bun run scripts/test-worker.ts <spec-path> [--save-llm-logs]');
		process.exit(1);
	}
	
	// Allow flag override to persist through this run
	if (enableLlmLogs) {
		config.saveLlmLogs = true;
	}
	
	runWorker(specPath)
		.then((result) => {
			console.log('\nResult:', JSON.stringify(result, null, 2));
			process.exit(result.status === 'passed' ? 0 : 1);
		})
		.catch((error) => {
			console.error('Worker error:', error);
			process.exit(1);
		});
}
