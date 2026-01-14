# E2E Test Orchestrator - Testing Guide

## Quick Test Checklist

Follow these steps in order to verify the implementation:

1. ✅ **Prerequisites** - Install dependencies
2. ✅ **LLM Integration** - Test agent connection
3. ✅ **Single Test** - Run one test spec
4. ✅ **Full Suite** - Run orchestrator with all specs
5. ✅ **Verify Outputs** - Check reports and debug files

---

## Step 1: Prerequisites

### Install Dependencies

```bash
# Install project dependencies
bun install

# Install Playwright browser
bun run test:e2e:install
```

**Expected Output:**
```
Installing Chromium...
Chromium installed successfully
```

### Verify Setup

```bash
# Check Playwright is installed
bunx playwright --version

# Check bun can run scripts
bun run test:e2e:orchestrate --help  # Should show usage or run
```

---

## Step 2: Configure Environment

### Set Up API Key (for LLM fixes)

```bash
# Create/update .env file
echo "CURSOR_API_KEY=your-api-key-here" >> .env

# Or set temporarily
export CURSOR_API_KEY=your-api-key-here
```

**Get API Key:**
- Go to https://cursor.com
- Navigate to **Integrations** > **User API Keys**
- Create a new key and copy it

### Verify Cursor CLI (agent)

```bash
# Check if agent is available
agent --version

# If not found, install it:
curl https://cursor.com/install -fsS | bash

# Add to PATH (zsh):
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 3: Test LLM Integration

This verifies that agent can be called and responds:

```bash
bun run test:e2e:llm-test
```

**Expected Output:**
```
🧪 Testing agent Integration

✅ CURSOR_API_KEY found

🔍 Checking if agent is available...

✅ agent is working!

Response: Hello, I am agent
```

**If it fails:**
- Check `CURSOR_API_KEY` is set correctly
- Verify `agent` CLI is installed: `agent --version`
- Install if needed: `curl https://cursor.com/install -fsS | bash`
- Add to PATH: `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc`
- Check network connectivity

---

## Step 4: Start Your Application

The tests need your app running:

```bash
# Terminal 1: Start the app
bun run dev
```

**Wait for:**
- App to start on http://localhost:4000
- No errors in console
- App is accessible (visit in browser to verify)

**Health Check:**
```bash
# Verify app is responding
curl http://localhost:4000/health
# Or visit http://localhost:4000 in browser
```

---

## Step 5: Run a Single Test

Test one spec to verify the system works:

```bash
# Terminal 2: Run single test
bun run scripts/test-worker.ts e2e/specs/create-free-booking.spec.ts
```

**Expected Output:**
```
Running test: create-free-booking.spec.ts
  ✅ Test passed (attempt 1)
  
Result: {
  "spec": "create-free-booking",
  "status": "passed",
  "duration": 1234,
  "attempts": 1
}
```

**What to Look For:**
- ✅ Test executes without errors
- ✅ Browser launches (if not headless)
- ✅ Test completes successfully
- ✅ Result JSON is printed

**If it fails:**
- Check app is running
- Verify test spec syntax
- Check browser installation
- Review error messages

---

## Step 6: Run Full Orchestrator

Run all test specs with the orchestrator:

```bash
# Terminal 2: Run orchestrator
bun run test:e2e:orchestrate
```

**Expected Output:**
```
🔍 Discovering test specs...
  Found 1 spec(s)

🏥 Checking app health...
  ✅ App is healthy at http://localhost:4000

🚀 Starting test execution...
  Worker 1: create-free-booking.spec.ts

📊 Test Results:
  ✅ create-free-booking: PASSED (1.2s, 1 attempt)

📝 Generating report...
  Report saved to: docs/e2e-test-results/report-2024-01-15-123456.md

✨ All tests completed!
```

**What to Look For:**
- ✅ Specs are discovered
- ✅ App health check passes
- ✅ Tests execute in parallel (if multiple specs)
- ✅ Report is generated
- ✅ Summary shows results

---

## Step 7: Test LLM Auto-Fix (Optional)

To test the LLM fix functionality, intentionally break a test:

### Option A: Break a Test Spec

1. Edit `e2e/specs/create-free-booking.spec.ts`
2. Change a selector to something that doesn't exist:
   ```typescript
   // Change this:
   await page.click('[data-testid="timeslot"]');
   
   // To this (wrong selector):
   await page.click('[data-testid="nonexistent"]');
   ```

3. Run the test:
   ```bash
   bun run scripts/test-worker.ts e2e/specs/create-free-booking.spec.ts
   ```

**Expected Behavior:**
```
Running test: create-free-booking.spec.ts
  ❌ Test failed (attempt 1)
  🔧 Test failed, invoking LLM to fix (attempt 1)...
  🤖 Invoking LLM to analyze and fix test failure...
  ✏️  LLM proposed fix (strategy: Changed selector approach)
  ✏️  Fix applied, retrying...
  ✅ Test passed (attempt 2)
```

**What to Look For:**
- ✅ Debug files are created in `e2e/debug/create-free-booking/`
- ✅ LLM is called (check for API call)
- ✅ Fix is proposed and applied
- ✅ Test retries with fix
- ✅ Test eventually passes (or fails after max retries)

### Option B: Check Debug Files

After a failure, check debug files:

```bash
# List debug files
ls -la e2e/debug/create-free-booking/attempt-1-*/

# View DOM snapshot
cat e2e/debug/create-free-booking/attempt-1-*/dom.html | head -50

# View available elements
cat e2e/debug/create-free-booking/attempt-1-*/elements.json

# View error details
cat e2e/debug/create-free-booking/attempt-1-*/error.txt
```

---

## Step 8: Verify Outputs

### Check Test Report

```bash
# List reports
ls -la docs/e2e-test-results/

# View latest report
cat docs/e2e-test-results/report-*.md | tail -100
```

**Report Should Include:**
- ✅ Summary with pass/fail counts
- ✅ Individual test results
- ✅ Fix proposals (if any)
- ✅ Metrics (duration, attempts, etc.)

### Check Debug Files (if tests failed)

```bash
# List all debug directories
find e2e/debug -type d

# View a specific debug attempt
ls -la e2e/debug/create-free-booking/attempt-1-*/
```

**Debug Files Should Include:**
- ✅ `dom.html` - Full page HTML
- ✅ `elements.json` - Available elements
- ✅ `console.log` - Browser console messages
- ✅ `error.txt` - Error details
- ✅ `screenshot.png` - Page screenshot (if enabled)

---

## Troubleshooting

### "App not healthy"

**Problem:** Health check fails

**Solutions:**
```bash
# Check app is running
curl http://localhost:4000/health

# Check BASE_URL in e2e.config.ts
# Default: http://localhost:4000

# Try custom health endpoint
HEALTH_CHECK_ENDPOINT=/api/health bun run test:e2e:orchestrate
```

### "agent not found"

**Problem:** LLM fixes won't work

**Solutions:**
```bash
# Install Cursor CLI
curl https://cursor.com/install -fsS | bash

# Add to PATH (zsh)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
agent --version

# Test integration
bun run test:e2e:llm-test
```

### "Test timeout"

**Problem:** Tests take too long

**Solutions:**
```bash
# Increase timeout
TIMEOUT=300000 bun run test:e2e:orchestrate

# Or edit e2e.config.ts
```

### "No specs found"

**Problem:** Orchestrator can't find test specs

**Solutions:**
```bash
# Check specs directory
ls e2e/specs/

# Verify spec files end with .spec.ts
# Check e2e.config.ts for correct specsDir
```

### "Browser not installed"

**Problem:** Playwright can't launch browser

**Solutions:**
```bash
# Reinstall browsers
bun run test:e2e:install

# Or install all browsers
bunx playwright install
```

---

## Advanced Testing

### Test with Different Base URL

```bash
# Test against staging
BASE_URL=https://staging.example.com bun run test:e2e:orchestrate

# Test against different port
BASE_URL=http://localhost:3000 bun run test:e2e:orchestrate
```

### Test with Custom Configuration

```bash
# More workers
MAX_WORKERS=10 bun run test:e2e:orchestrate

# Longer timeout
TIMEOUT=300000 bun run test:e2e:orchestrate

# More retries
MAX_RETRIES=5 bun run test:e2e:orchestrate
```

### Test in Docker (Optional)

```bash
# Copy templates
cp docker-compose.test.yml.template docker-compose.test.yml
cp Dockerfile.test.template Dockerfile.test

# Set environment variables
export CURSOR_API_KEY=your-key
export POSTGRES_PASSWORD=test_password

# Run in Docker
docker-compose -f docker-compose.test.yml up --build
```

---

## Success Criteria

Your implementation is working if:

1. ✅ **Prerequisites**: Dependencies install successfully
2. ✅ **LLM Test**: `bun run test:e2e:llm-test` passes
3. ✅ **Single Test**: One spec runs and completes
4. ✅ **Orchestrator**: Discovers specs and runs them
5. ✅ **Reports**: Markdown report is generated
6. ✅ **Debug Files**: Created on test failures
7. ✅ **LLM Fixes**: Proposed when tests fail (if API key set)

---

## Next Steps

Once basic testing passes:

1. **Add More Test Specs**: Use the template to create more tests
2. **Review Reports**: Check fix proposals and improve tests
3. **Set Up CI/CD**: Integrate into GitHub Actions
4. **Monitor Costs**: Track LLM API usage
5. **Optimize**: Improve fix strategies based on results

---

## Quick Reference

```bash
# Install dependencies
bun install && bun run test:e2e:install

# Test LLM integration
bun run test:e2e:llm-test

# Start app (Terminal 1)
bun run dev

# Run single test (Terminal 2)
bun run scripts/test-worker.ts e2e/specs/create-free-booking.spec.ts

# Run all tests (Terminal 2)
bun run test:e2e:orchestrate

# View latest report
cat docs/e2e-test-results/report-*.md | tail -50
```
