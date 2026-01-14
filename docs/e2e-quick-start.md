# E2E Test Orchestrator - Quick Start Guide

## ✅ What's Been Implemented

### Core Files Created
- ✅ `playwright.config.ts` - Playwright configuration
- ✅ `e2e.config.ts` - Orchestrator configuration
- ✅ `scripts/test-utils.ts` - Helper utilities
- ✅ `scripts/test-worker.ts` - Individual test runner
- ✅ `scripts/test-orchestrator.ts` - Main orchestrator
- ✅ `e2e/specs/create-free-booking.spec.ts` - First test spec
- ✅ `package.json` - Updated with Playwright and scripts

### Templates Created
- ✅ `docker-compose.test.yml.template` - Docker Compose setup
- ✅ `Dockerfile.test.template` - Test container Dockerfile
- ✅ `e2e/specs/.template.spec.ts` - Test spec template
- ✅ `.env` - Environment variables file

## 🚀 Next Steps

### 1. Install Dependencies

```bash
# Install Playwright
bun install

# Install Playwright browsers
bun run test:e2e:install
```

### 2. Set Up Cursor API Key

```bash
# Edit .env file and add your Cursor API key
# Get it from: https://cursor.com > Integrations > User API Keys
CURSOR_API_KEY=your-api-key-here
```

### 2.5. Test LLM Integration

```bash
# Verify agent is working
bun run test:e2e:llm-test

# This will:
# - Check if CURSOR_API_KEY is set
# - Test if agent CLI is available
# - Verify it can make API calls
```

### 3. Start Your App

```bash
# In one terminal, start your app
bun run dev
```

### 4. Run Your First Test

```bash
# Run the orchestrator (will discover and run all specs)
bun run test:e2e:orchestrate

# Or run a single spec
bun run scripts/test-worker.ts e2e/specs/create-free-booking.spec.ts
```

### 5. Verify Test Data

Make sure you have:
- Test tenant with slug `gold` and `allowPublicRead=true`
- Test event with slug `free-event` 
- Event has available timeslots
- Event has no prices or all prices = $0

## 📝 Current Status

### ✅ Working
- Test spec discovery
- Orchestrator with parallelization
- Worker execution framework
- Debug file collection
- Report generation

### ✅ Implemented
- **LLM Fix Integration**: Fully implemented in `test-worker.ts`
  - Calls `agent` CLI with comprehensive prompts
  - Parses multiple response formats (JSON, markdown, plain text)
  - Handles errors gracefully with fallbacks

### 🔧 Known Limitations
- Test execution uses Function constructor (needs refinement)
- LLM auto-fix fully connected to agent CLI
- Cost tracking is estimated (not actual API usage)

## 🐛 Troubleshooting

### "No test specs found"
- Check that `e2e/specs/` directory exists
- Verify spec files end with `.spec.ts`
- Check file permissions

### "App is not accessible"
- Ensure app is running on `http://localhost:4000`
- Or set `BASE_URL` environment variable
- Check app health endpoint at `/health`

### "CURSOR_API_KEY not set"
- Add API key to `.env` file
- Or set as environment variable: `CURSOR_API_KEY=xxx bun run test:e2e:orchestrate`

### "agent command not found"
- Install Cursor CLI: `curl https://cursor.com/install -fsS | bash`
- Add to PATH: `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc`
- Verify: `agent --version`
- Test with: `bun run test:e2e:llm-test`

### Test execution errors
- Check browser installation: `bun run test:e2e:install`
- Verify Playwright version compatibility
- Check test spec syntax matches template

## 📚 Documentation

- **Architecture**: `docs/e2e-test-orchestrator-architecture.md`
- **Test Plan**: `docs/e2e-checkout-test-plan.md`
- **Implementation Checklist**: `docs/e2e-implementation-checklist.md`
- **Docker Setup**: `docker-compose.test.yml.template`

## 🔜 Next Implementation Phase

1. **Add more test specs** from test plan
2. **Refine test execution** (better Playwright integration)
3. **Add more test specs** from test plan
4. **Set up Docker Compose** for containerized testing
5. **Add CI/CD integration**
