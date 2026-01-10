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

### 3. Worker Execution

```typescript
// scripts/test-worker.ts
async function runSpec(specPath: string) {
  const spec = await loadSpec(specPath);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Run test with timeout
      const result = await runPlaywrightTest(spec.code, {
        timeout: 180000, // 3 minutes
      });

      if (result.success) {
        return {
          success: true,
          attempts: attempt,
          fixes: attempt > 1 ? getAppliedFixes() : [],
        };
      }
    } catch (error) {
      if (attempt === 3) {
        // Max retries reached
        return {
          success: false,
          attempts: attempt,
          error: error,
          unfixable: true,
        };
      }

      // Ask LLM to fix strategy
      const fix = await llmFixStrategy(spec, error, attempt);
      spec.code = applyFix(spec.code, fix);
    }
  }
}
```

### 4. LLM Fix Strategy

```typescript
async function llmFixStrategy(spec, error, attempt) {
  const prompt = `
    Test spec goal: ${spec.goal}
    Test steps: ${spec.steps.join(", ")}
    Current code: ${spec.code}
    Error: ${error.message}
    Attempt: ${attempt}/3

    Analyze the failure and propose a strategy-level fix.
    Focus on:
    - Different navigation approach
    - Different waiting strategy
    - Different element selection
    - Handling dynamic content

    Return the fixed code section.
  `;

  // Use cursor-agent to fix
  const fix = await cursorAgent.execute(prompt);
  return fix;
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

### Recommended Security Configuration

#### Multi-Layer Approach

```typescript
// scripts/test-orchestrator-secure.ts
import { Docker } from "dockerode";
import { ResourceLimiter } from "./security/resource-limiter";
import { CodeValidator } from "./security/code-validator";
import { NetworkIsolator } from "./security/network-isolator";

class SecureTestOrchestrator {
  private docker: Docker;
  private validator: CodeValidator;
  private limiter: ResourceLimiter;
  private network: NetworkIsolator;

  constructor() {
    this.docker = new Docker();
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

    // 2. Run in Docker container
    const container = await this.docker.createContainer({
      Image: "test-runner:latest",
      Cmd: ["node", "/app/run-test.js"],
      HostConfig: {
        // Resource limits
        Memory: this.limiter.maxMemory,
        CpuQuota: this.limiter.cpuQuota,
        // Network restrictions
        NetworkMode: "test-network",
        // File system isolation
        Binds: [`${spec.path}:/app/spec.ts:ro`, "./e2e/results:/app/results"],
      },
      // Security options
      SecurityOpt: [
        "no-new-privileges:true",
        "seccomp:unconfined", // Or custom seccomp profile
      ],
      CapDrop: ["ALL"],
    });

    // 3. Apply network restrictions
    await this.network.configure(container);

    // 4. Run with timeout
    await container.start();
    const result = await Promise.race([
      this.runTest(container),
      this.limiter.timeout(),
    ]);
    await container.remove();

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

**For Production/CI:**

- ✅ Docker containers (Option 1)
- ✅ Code validation before execution
- ✅ Network isolation (block external)
- ✅ Resource limits
- ✅ Audit logging

**For Development:**

- ⚠️ Process sandboxing (Option 2) - faster iteration
- ✅ Code validation
- ✅ Resource limits
- ⚠️ Network restrictions (more permissive)

## Considerations

- **Cost**: Each LLM fix uses API calls - consider caching common fixes
- **Time**: Parallelization helps but LLM fixes add latency
- **Reliability**: LLM fixes may not always work - 3 retry limit prevents infinite loops
- **Maintenance**: Specs should be reviewed periodically even if auto-fixed
- **Security**: Run tests in sandboxed environment with resource limits and network isolation
