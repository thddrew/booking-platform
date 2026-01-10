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
    "Verify booking confirmation displays"
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
    "Booking reference ID is displayed"
  ]
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
  const specs = await discoverSpecs('e2e/specs');

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
        timeout: 180000  // 3 minutes
      });

      if (result.success) {
        return {
          success: true,
          attempts: attempt,
          fixes: attempt > 1 ? getAppliedFixes() : []
        };
      }
    } catch (error) {
      if (attempt === 3) {
        // Max retries reached
        return {
          success: false,
          attempts: attempt,
          error: error,
          unfixable: true
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
    Test steps: ${spec.steps.join(', ')}
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
    ${results.fixed.map(fix => `
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
    `).join('\n')}

    ## Unfixable Tests
    ${results.unfixable.map(test => `
      ### ${test.spec}
      **Error:** ${test.error}
      **Analysis:** ${test.analysis}
    `).join('\n')}
  `;

  await writeReport(report);
}
```

---

## Configuration

```typescript
// e2e.config.ts
export default {
  specsDir: 'e2e/specs',
  maxWorkers: 5,
  maxRetries: 3,
  timeout: 180000,  // 3 minutes (180 seconds)
  reportDir: 'docs/e2e-test-results',
  playwrightConfig: 'playwright.config.ts'
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

## Considerations

- **Cost**: Each LLM fix uses API calls - consider caching common fixes
- **Time**: Parallelization helps but LLM fixes add latency
- **Reliability**: LLM fixes may not always work - 3 retry limit prevents infinite loops
- **Maintenance**: Specs should be reviewed periodically even if auto-fixed
