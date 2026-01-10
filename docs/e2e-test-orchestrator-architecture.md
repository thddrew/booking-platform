# E2E Test Orchestrator Architecture

## Overview

An orchestrator model that spawns multiple `cursor-agent` workers to run test specs in parallel. Each worker executes a test spec with Playwright, and uses LLM to auto-fix failures through strategy-level adjustments.

## Architecture

```
Orchestrator (cursor-agent)
    ↓
Auto-discovers spec files
    ↓
Spawns N workers (max parallelization)
    ↓
Each Worker (cursor-agent):
   1. Runs test spec (Playwright)
   2. If fails → LLM analyzes & fixes strategy
   3. Retries (max 3 attempts, 30s timeout)
   4. Reports result
    ↓
Orchestrator aggregates results
    ↓
Generates report (proposed fixes, no code changes)
```

---

## 1. Test Spec Format

**Format: Option B (Rich)** - Each spec file contains goal, steps, code, and assertions.

```typescript
// e2e/specs/create-free-booking.spec.ts
export default {
  goal: "Create a free event booking as a guest user",

  steps: [
    "Navigate to event detail page",
    "Select available timeslot",
    "Fill customer info form (firstName, lastName, email)",
    "Submit form",
    "Verify redirect to success page",
    "Verify booking confirmation displays",
  ],

  code: `
    import { test, expect } from '@playwright/test';

    test('Create free event booking', async ({ page }) => {
      // Navigate to event detail page
      await page.goto('/tenant-slugs/gold/events/free-event');

      // Select first available timeslot
      await page.click('[data-testid="date-button"]:first-child');
      await page.click('[data-testid="timeslot"]:first-child');

      // Click Book Event button
      await page.click('button:has-text("Book Event")');

      // Fill customer info form
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john.doe@example.com');

      // Submit form
      await page.click('button:has-text("Complete Booking")');

      // Verify success page
      await expect(page).toHaveURL(/\\/checkout\\/success/);
      await expect(page.locator('h1')).toContainText('Booking Confirmed');
    });
  `,

  assertions: [
    "URL contains bookingId and email parameters",
    "Success page displays 'Booking Confirmed!' heading",
    "Booking details card shows event information",
    "Customer name matches form input",
    "Email matches form input",
    "Booking reference ID is displayed",
  ],
};
```

---

## 2. Auto-fix Strategy

**Strategy: Option B (Strategy-level fixes)**

When a test fails, the LLM should:

1. Analyze the failure (error message, screenshot, DOM state)
2. Adjust the overall strategy (not just fix selectors):
   - Different navigation approach
   - Different waiting strategy
   - Different element selection method
   - Handle dynamic content differently
3. Rewrite relevant code sections with new strategy
4. Retry with fixed code

**Example Fix Flow:**

```
Original code: await page.click('[data-testid="timeslot"]');
Failure: Element not found after timeout

LLM fixes by:
1. Analyzing page structure
2. Finding alternative selector strategy
3. Adding explicit wait for timeslot container
4. Using text-based selection as fallback
5. Rewriting section:
   await page.waitForSelector('[data-testid="timeslots-container"]');
   await page.click('text=10:00 AM - 11:00 AM');
```

---

## 3. Orchestrator Behavior

### Spec Discovery

- **Auto-discover** all `*.spec.ts` files from `e2e/specs/` directory
- Recursively search subdirectories
- Filter out non-spec files

### Worker Spawning

- **One cursor-agent per spec** (parallel execution)
- **Max parallelization**: Configurable limit (e.g., 5 concurrent agents)
- Queue system for managing parallelization:
  - Start N workers immediately
  - Queue remaining specs
  - As workers complete, spawn next queued spec

### Result Aggregation

- Orchestrator waits for all workers to complete
- Collects results from all workers:
  - Passed tests
  - Failed tests (with error details)
  - Fixed tests (what was changed)
  - Unfixable tests (after max retries)
- Generates aggregated report at the end

---

## 4. Test Spec Structure

**Format: Self-contained (Option A)**

Each spec file contains everything needed:

- Goal statement
- Steps (human-readable)
- Code (Playwright test code)
- Assertions (expected outcomes)
- Test data (inline or fixtures reference)
- Setup/Teardown (if needed)

All in a single file for simplicity and portability.

---

## 5. Error Handling & Retries

### Per-Spec Configuration

- **Max Retries**: 3 attempts per spec
- **Global Timeout**: 3 minutes (180 seconds) per spec execution
- **Fix Strategy**: Try to fix in-place, otherwise log failure

### Retry Flow

```
Attempt 1: Run original code
  ↓ (if fails)
Attempt 2: LLM fixes strategy, run fixed code
  ↓ (if fails)
Attempt 3: LLM fixes with different strategy, run fixed code
  ↓ (if fails)
Log as unfixable, continue to next spec
```

### Timeout Handling

- Each test execution has 3 minute timeout
- If timeout occurs:
  - LLM analyzes why (slow page load, infinite wait, etc.)
  - Fixes with timeout adjustments or waiting strategy
  - Retries with fixed code

### Logging Strategy

- **Fixable failures**: Log proposed fix in report
- **Unfixable failures**: Log error details, screenshots, DOM state
- **Success after fix**: Log what was fixed and how

---

## 6. Feedback Loop

### Report Generation

Generate comprehensive report with:

- **Test Results Summary**:
  - Total specs run
  - Passed (with/without fixes)
  - Failed (fixable/unfixable)
  - Execution time

- **Proposed Fixes**:
  - For each fixed test:
    - Original code (snippet)
    - Failure reason
    - Proposed fix (code snippet)
    - Strategy change explanation
    - Outcome (pass/fail after fix)

- **Unfixable Tests**:
  - Failure details
  - Error messages
  - Screenshots (if available)
  - DOM state at failure
  - Analysis of why unfixable

- **Recommendations**:
  - Suggested manual fixes
  - Common patterns in failures
  - Test infrastructure improvements

### Code Changes

- **Do NOT** modify spec files automatically
- **Do NOT** commit changes
- **Only** generate report with proposed fixes
- Report format: Markdown with code diffs

---

## File Structure

```
scripts/
  test-orchestrator.ts          # Main orchestrator
  test-worker.ts               # Individual worker runner
  test-utils.ts                # Helper utilities

e2e/
  specs/
    create-free-booking.spec.ts
    create-paid-booking.spec.ts
    checkout-form-validation.spec.ts
    # ... more specs
  fixtures/
    events.ts                  # Test data helpers
  utils/
    playwright-helpers.ts      # Playwright utilities

playwright.config.ts           # Playwright config

docs/
  e2e-checkout-test-plan.md    # Original test plan
  e2e-test-results/            # Generated reports
    YYYY-MM-DD-HHmmss-report.md
```

---

## Orchestrator Flow

### 1. Initialization

```typescript
// scripts/test-orchestrator.ts
async function main() {
  // Discover all spec files
  const specs = await discoverSpecs("e2e/specs");

  // Load Playwright config
  const config = loadPlaywrightConfig();

  // Create result aggregator
  const results = new ResultAggregator();
}
```

### 2. Worker Spawning

```typescript
// Spawn workers with parallelization limit
const maxWorkers = 5;
const queue = [...specs];
const activeWorkers = [];

while (queue.length > 0 || activeWorkers.length > 0) {
  // Spawn new workers up to max
  while (activeWorkers.length < maxWorkers && queue.length > 0) {
    const spec = queue.shift();
    const worker = spawnWorker(spec);
    activeWorkers.push(worker);
  }

  // Wait for one worker to complete
  const completed = await Promise.race(activeWorkers);
  activeWorkers.splice(activeWorkers.indexOf(completed), 1);
  results.add(completed.result);
}
```

### 3. Worker Execution with DOM Debugging

```typescript
// scripts/test-worker.ts
import { chromium, type Page } from "playwright";

async function runSpec(specPath: string) {
  const spec = await loadSpec(specPath);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track console messages and network failures
  const consoleMessages: string[] = [];
  const networkFailures: string[] = [];

  page.on("console", (msg) =>
    consoleMessages.push(`${msg.type()}: ${msg.text()}`)
  );
  page.on("requestfailed", (request) => {
    networkFailures.push(
      `${request.method()} ${request.url()}: ${request.failure()?.errorText}`
    );
  });

  const pageContext = { page, consoleMessages, networkFailures };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Run test with timeout
      const result = await runPlaywrightTest(spec.code, {
        timeout: 180000, // 3 minutes
        pageContext, // Pass page context for debugging
      });

      if (result.success) {
        await browser.close();
        return {
          success: true,
          attempts: attempt,
          fixes: attempt > 1 ? getAppliedFixes() : [],
        };
      }
    } catch (error) {
      if (attempt === 3) {
        // Max retries reached - collect final debug info
        const debugInfo = await collectDebugInfo(pageContext, error);
        await browser.close();
        return {
          success: false,
          attempts: attempt,
          error: error,
          debugInfo, // Include debug info in final result
          unfixable: true,
        };
      }

      // Ask LLM to fix strategy with DOM context
      const fix = await llmFixStrategy(spec, error, attempt, pageContext);
      spec.code = applyFix(spec.code, fix);

      // Don't close browser - retry with same page context
    }
  }

  await browser.close();
}
```

### 4. DOM Debugging Access

**Yes, the LLM has access to the headless DOM state for debugging.**

When a test fails, the worker collects comprehensive debugging information from Playwright's page context:

**Available Debugging Information:**

- ✅ **DOM Snapshot** - Full HTML content of the page
- ✅ **Accessibility Tree** - Structured representation of accessible elements
- ✅ **Available Elements** - List of all selectable elements with their attributes (data-testid, id, class, role, text)
- ✅ **Screenshot** - Visual snapshot of the page state (base64 encoded)
- ✅ **Console Logs** - Browser console messages
- ✅ **Network Requests** - Failed network requests with error details
- ✅ **Page State** - Current URL, page title
- ✅ **Error Stack Trace** - Full error stack for analysis

**How It Works:**

1. Test runs in Playwright with page context tracking
2. On failure, debug info is collected BEFORE page closes
3. Debug info is saved to local files (not passed in prompt to avoid token limits)
4. LLM is given file paths and can use grep/find to search files as needed
5. LLM reads specific debug files only when needed for analysis
6. LLM proposes fixes based on real page state discovered through file searches

**Benefits:**

- ✅ **Efficient Context Usage**: Large debug data saved to files, not in prompt
- ✅ **On-Demand Access**: LLM only reads files it needs via grep/find
- ✅ **Full DOM Access**: No size limits - LLM can search full DOM snapshot
- ✅ **Structured Data**: JSON files for easy parsing and searching
- ✅ **Visual Debugging**: Screenshot available when needed
- ✅ **Searchable**: LLM can grep for specific patterns, attributes, text
- ✅ **Persistent**: Debug files saved for later analysis if test fails completely

**File Structure:**
```
e2e/debug/
  {spec-name}/
    attempt-1-{timestamp}/
      dom.html              # Full DOM snapshot
      accessibility.json    # Accessibility tree
      elements.json         # Available elements with attributes
      screenshot.png        # Page screenshot
      console.log           # Console messages
      network.log           # Network failures
      error.txt             # Error details
      README.txt            # Summary/index
    attempt-2-{timestamp}/  # Retry debug files
    attempt-3-{timestamp}/  # Final attempt debug files
```

### 5. LLM Fix Strategy with DOM Context

```typescript
async function llmFixStrategy(spec, error, attempt, pageContext) {
  // Collect and save debugging information to files
  const debugInfo = await collectDebugInfo(pageContext, error);
  const debugDir = await saveDebugInfo(debugInfo, spec.path, attempt);
 
  const prompt = `
    Test spec goal: ${spec.goal}
    Test steps: ${spec.steps.join(", ")}
    Current code: ${spec.code}
    Error: ${error.message}
    Attempt: ${attempt}/3
 
    **Debugging Context:**
    - Page URL: ${debugInfo.url}
    - Page Title: ${debugInfo.title}
    - Error Stack Trace: ${debugInfo.stackTrace}
    - Debug files location: ${debugDir}
 
    **Debug Files Available (read with grep/find as needed):**
    - ${debugDir}/dom.html - Full DOM snapshot
    - ${debugDir}/accessibility.json - Accessibility tree
    - ${debugDir}/elements.json - Available selectable elements
    - ${debugDir}/screenshot.png - Page screenshot
    - ${debugDir}/console.log - Console messages
    - ${debugDir}/network.log - Failed network requests
 
    **Instructions:**
    1. Use grep/find to search the debug files as needed
    2. Example: grep -i "timeslot" ${debugDir}/dom.html
    3. Example: grep "data-testid" ${debugDir}/elements.json
    4. Read files only when you need specific information
    
    Analyze the failure and propose a strategy-level fix.
    Focus on:
    - Different navigation approach
    - Different waiting strategy
    - Different element selection (check elements.json for actual available elements)
    - Handling dynamic content
    - Correct selector based on actual page structure (search dom.html)
 
    Return the fixed code section.
  `;
 
  // Use cursor-agent with file system access to read debug files
  const fix = await cursorAgent.execute(prompt, {
    workingDirectory: debugDir,
    allowFileAccess: true,
  });
  return fix;
}

import * as fs from "fs/promises";
import * as path from "path";

async function collectDebugInfo(pageContext, error) {
  const page = pageContext.page;
 
  try {
    // 1. Get current page state
    const url = page.url();
    const title = await page.title();
 
    // 2. Get DOM snapshot (full HTML - no size limit)
    const domSnapshot = await page.content();
 
    // 3. Get accessibility tree (structured DOM representation)
    const accessibilityTree = await page.accessibility.snapshot();
 
    // 4. Get available selectable elements
    const availableElements = await page.evaluate(() => {
      const elements = [];
      // Get elements with common identifiers
      document
        .querySelectorAll(
          "[data-testid], [id], [class], [role], button, a, input, select"
        )
        .forEach((el) => {
          const info = {
            tag: el.tagName,
            testId: el.getAttribute("data-testid"),
            id: el.getAttribute("id"),
            class: el.getAttribute("class"),
            role: el.getAttribute("role"),
            text: el.textContent?.trim().substring(0, 50),
            visible: el.offsetWidth > 0 && el.offsetHeight > 0,
          };
          elements.push(info);
        });
      return elements;
    });
 
    // 5. Take screenshot
    const screenshotBuffer = await page.screenshot({ fullPage: false });
 
    // 6. Get console logs
    const consoleLogs = pageContext.consoleMessages || [];
 
    // 7. Get network requests (if any failed)
    const networkRequests = pageContext.networkFailures || [];
 
    // 8. Error stack trace
    const stackTrace = error.stack || "";
 
    return {
      url,
      title,
      domSnapshot, // Full snapshot - no size limit
      accessibilityTree,
      availableElements,
      screenshotBuffer,
      consoleLogs,
      networkRequests,
      stackTrace,
    };
  } catch (e) {
    // If page is closed/crashed, return minimal info
    return {
      url: "Page not available",
      title: "Page crashed",
      domSnapshot: "",
      accessibilityTree: null,
      availableElements: [],
      screenshotBuffer: null,
      consoleLogs: [],
      networkRequests: [],
      stackTrace: error.stack || "",
    };
  }
}

async function saveDebugInfo(debugInfo, specPath, attempt) {
  // Create debug directory: e2e/debug/{spec-name}/attempt-{n}/
  const specName = path.basename(specPath, ".spec.ts");
  const debugDir = path.join(
    "e2e",
    "debug",
    specName,
    `attempt-${attempt}-${Date.now()}`
  );
  
  await fs.mkdir(debugDir, { recursive: true });
 
  // Save debug files
  await Promise.all([
    // 1. DOM snapshot as HTML
    fs.writeFile(
      path.join(debugDir, "dom.html"),
      debugInfo.domSnapshot || "<html><body>No DOM available</body></html>"
    ),
    
    // 2. Accessibility tree as JSON
    fs.writeFile(
      path.join(debugDir, "accessibility.json"),
      JSON.stringify(debugInfo.accessibilityTree, null, 2)
    ),
    
    // 3. Available elements as JSON
    fs.writeFile(
      path.join(debugDir, "elements.json"),
      JSON.stringify(debugInfo.availableElements, null, 2)
    ),
    
    // 4. Screenshot as PNG
    debugInfo.screenshotBuffer
      ? fs.writeFile(
          path.join(debugDir, "screenshot.png"),
          debugInfo.screenshotBuffer
        )
      : Promise.resolve(),
    
    // 5. Console logs as text
    fs.writeFile(
      path.join(debugDir, "console.log"),
      debugInfo.consoleLogs.join("\n") || "No console logs"
    ),
    
    // 6. Network failures as text
    fs.writeFile(
      path.join(debugDir, "network.log"),
      debugInfo.networkRequests.join("\n") || "No network failures"
    ),
    
    // 7. Error info as text
    fs.writeFile(
      path.join(debugDir, "error.txt"),
      `URL: ${debugInfo.url}\n` +
        `Title: ${debugInfo.title}\n\n` +
        `Stack Trace:\n${debugInfo.stackTrace}`
    ),
    
    // 8. Index file with summary
    fs.writeFile(
      path.join(debugDir, "README.txt"),
      `Debug Information\n` +
        `================\n\n` +
        `Page URL: ${debugInfo.url}\n` +
        `Page Title: ${debugInfo.title}\n` +
        `Elements Found: ${debugInfo.availableElements?.length || 0}\n` +
        `Console Messages: ${debugInfo.consoleLogs?.length || 0}\n` +
        `Network Failures: ${debugInfo.networkRequests?.length || 0}\n\n` +
        `Files:\n` +
        `- dom.html: Full DOM snapshot\n` +
        `- accessibility.json: Accessibility tree\n` +
        `- elements.json: Selectable elements with attributes\n` +
        `- screenshot.png: Visual page state\n` +
        `- console.log: Browser console messages\n` +
        `- network.log: Failed network requests\n` +
        `- error.txt: Error details and stack trace`
    ),
  ]);
 
  return debugDir;
}
```

### 5. Report Generation

```typescript
async function generateReport(results) {
  const report = `
    # E2E Test Execution Report
    Date: ${new Date().toISOString()}

    ## Summary
    - Total Specs: ${results.total}
    - Passed: ${results.passed}
    - Failed (Fixed): ${results.fixed}
    - Failed (Unfixable): ${results.unfixable}

    ## Proposed Fixes
    ${results.fixed
      .map(
        (fix) => `
      ### ${fix.spec}
      **Original Code:**
      \`\`\`typescript
      ${fix.original}
      \`\`\`

      **Proposed Fix:**
      \`\`\`typescript
      ${fix.proposed}
      \`\`\`

      **Strategy Change:** ${fix.explanation}
      **Result:** ${fix.outcome}
    `
      )
      .join("\n")}

    ## Unfixable Tests
    ${results.unfixable
      .map(
        (test) => `
      ### ${test.spec}
      **Error:** ${test.error}
      **Analysis:** ${test.analysis}
    `
      )
      .join("\n")}
  `;

  await writeReport(report);
}
```

---

## Configuration

```typescript
// e2e.config.ts
export default {
  specsDir: "e2e/specs",
  maxWorkers: 5,
  maxRetries: 3,
  timeout: 180000, // 3 minutes (180 seconds)
  reportDir: "docs/e2e-test-results",
  playwrightConfig: "playwright.config.ts",
};
```

---

## Usage

```bash
# Run orchestrator
npm run test:e2e:orchestrate

# Or with custom config
npm run test:e2e:orchestrate -- --max-workers 10 --timeout 60000
```

---

## Next Steps

1. Create orchestrator script
2. Create worker script
3. Create test spec format/template
4. Set up Playwright config
5. Create example test spec
6. Test orchestrator with single spec
7. Scale to multiple specs

---

## Security & Sandboxing

### Security Concerns

Running LLM-generated code presents security risks:

- **Arbitrary Code Execution**: LLM could generate malicious code
- **File System Access**: Tests might access/modify sensitive files
- **Network Access**: Tests could exfiltrate data or attack external services
- **Process Execution**: Tests might spawn dangerous processes
- **Environment Variables**: Tests could access secrets

### Sandboxing Strategies

#### Option 1: Process Sandboxing (Recommended for Development)

**Isolation Level**: Medium-High
**Implementation**: Use Node.js `worker_threads` with VM context restrictions

```typescript
// scripts/test-worker-sandboxed.ts
import { spawn } from "child_process";
import { Docker } from "dockerode";

async function runSpecInDocker(spec: TestSpec) {
  const docker = new Docker();

  // Create isolated container
  const container = await docker.createContainer({
    Image: "mcr.microsoft.com/playwright:v1.57.0",
    Cmd: ["node", "/app/worker.js"],
    Env: ["NODE_ENV=test", `SPEC_PATH=${spec.path}`],
    // Security restrictions
    SecurityOpt: ["no-new-privileges:true"],
    CapDrop: ["ALL"],
    CapAdd: ["NET_BIND_SERVICE"], // Only allow binding to ports

    // File system isolation (read-only)
    HostConfig: {
      Binds: [
        // Mount spec as read-only
        `${spec.path}:/app/spec.ts:ro`,
        // Mount test results directory (write-only)
        "./e2e/test-results:/app/results",
      ],
      // Memory limit
      Memory: 512 * 1024 * 1024, // 512MB
      // CPU limit
      CpuQuota: 50000, // 50% of CPU
      // Network isolation
      NetworkMode: "bridge",
      // Restrict network access
      Dns: ["8.8.8.8"], // Only allow DNS resolution
    },

    // Resource limits
    Resources: {
      Limits: {
        memory: 512 * 1024 * 1024,
        cpus: "0.5",
      },
    },
  });

  await container.start();
  const logs = await container.logs({ follow: true });
  await container.wait();
  await container.remove();

  return logs;
}
```

**Security Features:**

- ✅ Complete process isolation
- ✅ File system isolation (read-only mounts)
- ✅ Network isolation (bridge network)
- ✅ Resource limits (memory, CPU)
- ✅ Dropped capabilities (no root privileges)
- ✅ Timeout enforcement at container level

#### Option 2: Docker Container (Future/Production)

**Isolation Level**: High
**Implementation**: Run each worker in isolated Docker container

**Note**: Recommended for production/CI environments where maximum isolation is required.

```typescript
// scripts/test-worker-sandboxed.ts
import { Worker, isMainThread, parentPort } from "worker_threads";
import { vm } from "vm";
import * as fs from "fs/promises";

class TestSandbox {
  private context: vm.Context;
  private allowedModules = ["playwright", "@playwright/test"];

  constructor() {
    // Create isolated VM context
    this.context = vm.createContext({
      // Only expose allowed globals
      test: this.safeTest,
      expect: this.safeExpect,
      page: null, // Injected by Playwright

      // Block dangerous globals
      require: this.safeRequire,
      process: this.restrictedProcess,
      fs: this.restrictedFs,

      // No access to:
      // - child_process
      // - os
      // - crypto (except safe functions)
      // - http/https
    });
  }

  private safeRequire = (module: string) => {
    if (!this.allowedModules.includes(module)) {
      throw new Error(`Module ${module} is not allowed`);
    }
    return require(module);
  };

  private restrictedProcess = {
    env: {
      // Only expose non-sensitive env vars
      NODE_ENV: process.env.NODE_ENV,
    },
    exit: () => {
      throw new Error("process.exit() is not allowed");
    },
    cwd: () => "/sandbox",
  };

  private restrictedFs = {
    readFile: async (path: string) => {
      // Only allow reading test fixtures
      if (!path.startsWith("/sandbox/fixtures/")) {
        throw new Error(`File access denied: ${path}`);
      }
      return fs.readFile(path);
    },
    writeFile: async (path: string, content: string) => {
      // Only allow writing to test results
      if (!path.startsWith("/sandbox/results/")) {
        throw new Error(`File write denied: ${path}`);
      }
      return fs.writeFile(path, content);
    },
  };

  async execute(code: string, timeout: number) {
    const script = new vm.Script(code, {
      timeout,
      filename: "test.spec.ts",
    });

    return script.runInContext(this.context, { timeout });
  }
}
```

**Security Features:**

- ✅ Module access restriction
- ✅ File system access control
- ✅ Process isolation (worker threads)
- ✅ Timeout enforcement
- ⚠️ Limited isolation (shared kernel)

#### Option 3: Separate User/Chroot

**Isolation Level**: Medium-High
**Implementation**: Run tests as non-root user in chroot jail

```bash
# Setup chroot environment
sudo mkdir -p /sandbox/{bin,lib,usr,etc,home}
sudo cp -r /usr/bin/playwright /sandbox/bin/
sudo chroot /sandbox /bin/playwright test
```

**Security Features:**

- ✅ User isolation (non-root)
- ✅ File system isolation (chroot)
- ✅ Process isolation
- ⚠️ Requires system-level setup

### Recommended Security Configuration (Development)

```typescript
// scripts/test-orchestrator-secure.ts
import { TestSandbox } from "./security/test-sandbox";
import { ResourceLimiter } from "./security/resource-limiter";
import { CodeValidator } from "./security/code-validator";

class SecureTestOrchestrator {
  private sandbox: TestSandbox;
  private validator: CodeValidator;
  private limiter: ResourceLimiter;

  constructor() {
    this.sandbox = new TestSandbox();
    this.validator = new CodeValidator();
    this.limiter = new ResourceLimiter({
      maxMemory: 512 * 1024 * 1024, // 512MB
      maxCpu: 0.5, // 50%
      maxDuration: 180000, // 3 minutes
    });
    this.network = new NetworkIsolator({
      allowedHosts: ["localhost", "127.0.0.1"],
      allowedPorts: [3000, 4000], // Test server ports
      blockExternal: true, // Block all external network
    });
  }

  async runSpec(spec: TestSpec) {
    // 1. Validate code before execution
    const validation = await this.validator.validate(spec.code);
    if (!validation.safe) {
      throw new Error(`Code validation failed: ${validation.reason}`);
    }

    // 2. Run in process sandbox with resource limits
    const result = await Promise.race([
      this.sandbox.execute(spec.code, this.limiter.maxDuration),
      this.limiter.timeout(),
    ]);

    return result;
  }
}
```

### Code Validation

**Static Analysis Before Execution:**

```typescript
// scripts/security/code-validator.ts
import { ESLint } from "eslint";
import * as babel from "@babel/parser";

class CodeValidator {
  private dangerousPatterns = [
    /child_process|exec|spawn/i,
    /fs\.(writeFile|unlink|rmdir|mkdir)/i,
    /process\.(exit|kill)/i,
    /eval\(|Function\(/i,
    /require\(['"](os|crypto|http|https|net)/i,
    /__dirname|__filename/i,
  ];

  async validate(code: string): Promise<{ safe: boolean; reason?: string }> {
    // 1. Parse AST to detect dangerous patterns
    try {
      const ast = babel.parse(code, {
        sourceType: "module",
        plugins: ["typescript"],
      });

      // 2. Check for dangerous patterns
      const found = this.dangerousPatterns.find((pattern) =>
        pattern.test(code)
      );

      if (found) {
        return {
          safe: false,
          reason: `Dangerous pattern detected: ${found}`,
        };
      }

      // 3. Validate AST structure (only Playwright API calls)
      if (!this.isValidPlaywrightCode(ast)) {
        return {
          safe: false,
          reason: "Code contains non-Playwright API calls",
        };
      }

      // 4. Lint for security issues
      const eslint = new ESLint({
        useEslintrc: false,
        baseConfig: {
          rules: {
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-new-func": "error",
            "no-script-url": "error",
          },
        },
      });

      const results = await eslint.lintText(code);
      if (results[0].errorCount > 0) {
        return {
          safe: false,
          reason: `Lint errors: ${results[0].messages.join(", ")}`,
        };
      }

      return { safe: true };
    } catch (error) {
      return {
        safe: false,
        reason: `Parse error: ${error.message}`,
      };
    }
  }

  private isValidPlaywrightCode(ast: babel.types.File): boolean {
    // Only allow:
    // - Playwright API calls (test, expect, page)
    // - Basic JavaScript (variables, functions, conditionals)
    // - No require() for dangerous modules
    // Implementation details...
    return true;
  }
}
```

### Network Isolation

```typescript
// scripts/security/network-isolator.ts
import { Docker } from "dockerode";

class NetworkIsolator {
  private allowedHosts: string[];
  private allowedPorts: number[];
  private blockExternal: boolean;

  async configure(container: Docker.Container) {
    // Create isolated Docker network
    const network = await this.docker.createNetwork({
      Name: "test-network",
      Driver: "bridge",
      IPAM: {
        Config: [
          {
            Subnet: "172.20.0.0/16",
          },
        ],
      },
      Internal: this.blockExternal, // Block external network
    });

    // Connect container to network
    await network.connect({ Container: container.id });

    // Apply iptables rules (if running on host)
    if (!this.blockExternal) {
      // Allow only specific hosts/ports
      this.allowedHosts.forEach((host) => {
        // iptables -A OUTPUT -d ${host} -j ACCEPT
      });
    }
  }
}
```

### Resource Limits

```typescript
// scripts/security/resource-limiter.ts
class ResourceLimiter {
  maxMemory: number;
  maxCpu: number;
  maxDuration: number;

  timeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Test timeout exceeded"));
      }, this.maxDuration);
    });
  }

  cpuQuota(): number {
    // Convert CPU percentage to Docker quota
    return Math.floor(this.maxCpu * 100000);
  }
}
```

### Security Checklist

- [ ] **Code Validation**: Validate spec code before execution
- [ ] **Sandboxing**: Run tests in isolated container/process
- [ ] **File System**: Restrict file access (read-only spec, write-only results)
- [ ] **Network**: Block or restrict network access
- [ ] **Resource Limits**: Enforce memory, CPU, and time limits
- [ ] **Capabilities**: Drop unnecessary Linux capabilities
- [ ] **User Isolation**: Run as non-root user
- [ ] **Secrets**: Never expose secrets to test environment
- [ ] **Audit Logging**: Log all test executions and fixes
- [ ] **Rate Limiting**: Limit concurrent executions

### Recommended Setup

**For Development (Current Focus):**

- ✅ Process sandboxing (Option 1) - fast iteration
- ✅ Code validation before execution
- ✅ Resource limits (memory, CPU, timeout)
- ⚠️ Network restrictions (allow localhost for dev server)
- ✅ Module access restrictions
- ✅ File system access control

**For Production/CI (Future):**

- ✅ Docker containers (Option 2) - maximum isolation
- ✅ Code validation before execution
- ✅ Network isolation (block external)
- ✅ Resource limits
- ✅ Audit logging
- ✅ User isolation (non-root)

## Considerations

- **Cost**: Each LLM fix uses API calls - consider caching common fixes
- **Time**: Parallelization helps but LLM fixes add latency
- **Reliability**: LLM fixes may not always work - 3 retry limit prevents infinite loops
- **Maintenance**: Specs should be reviewed periodically even if auto-fixed
- **Security**: Run tests in sandboxed environment with resource limits and network isolation
