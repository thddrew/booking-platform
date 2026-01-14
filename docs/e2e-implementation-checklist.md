# E2E LLM Test Orchestrator - Implementation Checklist

## ✅ Completed

- [x] Architecture document created
- [x] Docker Compose template created
- [x] Dockerfile.test template created
- [x] Environment variable templates created
- [x] Test spec template created
- [x] `.env` file created for Cursor API key

## 🔧 Implementation Required

### 1. Dependencies Installation

**Install Playwright:**
```bash
bun add -d @playwright/test playwright
npx playwright install chromium
```

**Install Cursor CLI (agent):**
```bash
# Install
curl https://cursor.com/install -fsS | bash

# Add to PATH (zsh)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Check if agent is available
agent --version

# If not, install: curl https://cursor.com/install -fsS | bash
# See docs/agent-installation.md for details
```

**Add to package.json scripts:**
```json
{
  "scripts": {
    "test:e2e:orchestrate": "bun run scripts/test-orchestrator.ts",
    "test:e2e:worker": "bun run scripts/test-worker.ts",
    "test:e2e:setup": "bun run scripts/test-setup.ts"
  }
}
```

### 2. Core Implementation Files

**Create these files:**

- [ ] `scripts/test-orchestrator.ts` - Main orchestrator
- [ ] `scripts/test-worker.ts` - Individual worker runner
- [ ] `scripts/test-utils.ts` - Helper utilities
- [ ] `e2e.config.ts` - Configuration file
- [ ] `playwright.config.ts` - Playwright configuration
- [ ] `e2e/fixtures/events.ts` - Test data helpers
- [ ] `e2e/utils/playwright-helpers.ts` - Playwright utilities

### 3. Configuration Files

- [ ] Create `playwright.config.ts` with baseURL configuration
- [ ] Create `e2e.config.ts` with all settings
- [ ] Copy `docker-compose.test.yml.template` to `docker-compose.test.yml`
- [ ] Copy `Dockerfile.test.template` to `Dockerfile.test`
- [ ] Create `.env.test` from template (for Docker Compose)

### 4. First Test Spec

- [ ] Create first test spec: `e2e/specs/create-free-booking.spec.ts`
- [ ] Based on test plan: `docs/e2e-checkout-test-plan.md`
- [ ] Use template: `e2e/specs/.template.spec.ts`

### 5. Database Setup for Tests

**Consider:**
- [ ] Test database seeding script
- [ ] Test data cleanup between runs
- [ ] Database reset strategy (fresh vs. incremental)
- [ ] Test tenant creation
- [ ] Test event creation
- [ ] Test user/customer creation

**Options:**
```typescript
// Option 1: Fresh database per test run
bun run db:migrate:fresh && bun run db:seed:test

// Option 2: Reset specific test data
bun run db:reset:test

// Option 3: Use transactions (rollback after tests)
```

### 6. Cost Management

**Set up:**
- [ ] Cost tracking implementation
- [ ] Cost limits/alerts
- [ ] Rate limiting for LLM API calls
- [ ] Fix caching mechanism
- [ ] Cost reporting in test results

**Recommended limits:**
- Max cost per test run: $5-10
- Max LLM calls per spec: 3 (matches retry limit)
- Alert if cost exceeds threshold

### 7. CI/CD Integration

**GitHub Actions / CI Setup:**
- [ ] Create `.github/workflows/e2e-tests.yml`
- [ ] Configure secrets: `CURSOR_API_KEY`
- [ ] Set up Docker build and test execution
- [ ] Configure test result artifacts
- [ ] Set up PR comments with test results
- [ ] Configure cost alerts/notifications

**Consider:**
- Run tests on PR creation/update
- Run tests on main branch (nightly?)
- Skip tests if only docs changed
- Parallel test execution in CI

### 8. Monitoring & Observability

**Set up:**
- [ ] Test execution logging
- [ ] LLM API call tracking
- [ ] Fix success rate tracking
- [ ] Performance metrics (execution time, retries)
- [ ] Error categorization analytics
- [ ] Flaky test detection

**Tools to consider:**
- Test result dashboards
- Cost tracking dashboards
- Alerting (Slack, email, etc.)

### 9. Security Considerations

**Verify:**
- [ ] `.env` is in `.gitignore` ✅ (already done)
- [ ] `.env.test` is in `.gitignore`
- [ ] API keys never logged or committed
- [ ] Docker containers have proper network isolation
- [ ] Test data doesn't contain real secrets
- [ ] Code validation before execution (see architecture doc)

### 10. Performance Optimization

**Consider:**
- [ ] App startup time optimization
- [ ] Database seeding optimization
- [ ] Parallel test execution limits
- [ ] Debug file cleanup automation
- [ ] Test result caching (if applicable)
- [ ] Docker layer caching for faster builds

### 11. Error Handling & Recovery

**Implement:**
- [ ] Orchestrator checkpoint/resume
- [ ] Worker crash recovery
- [ ] LLM API failure handling
- [ ] Network failure retry logic
- [ ] Graceful shutdown handling
- [ ] Error reporting and notifications

### 12. Documentation

**Create/Update:**
- [ ] README for e2e tests
- [ ] Troubleshooting guide
- [ ] How to add new test specs
- [ ] How to debug failing tests
- [ ] Cost optimization guide
- [ ] CI/CD setup guide

### 13. Testing the Setup

**Verification steps:**
- [ ] Test agent authentication
- [ ] Test Docker Compose setup
- [ ] Test app health check
- [ ] Test single spec execution
- [ ] Test LLM fix flow
- [ ] Test report generation
- [ ] Test in CI environment

**Commands to verify:**
```bash
# 1. Test agent
agent --api-key $CURSOR_API_KEY "echo test"

# 2. Test Docker setup
docker-compose -f docker-compose.test.yml up -d postgres app
docker-compose -f docker-compose.test.yml run --rm tests --help

# 3. Test single spec
bun run test:e2e:orchestrate -- --spec create-free-booking.spec.ts

# 4. Test full flow
bun run test:e2e:orchestrate
```

## 🎯 Priority Order

### Phase 1: Core Setup (Week 1)
1. Install dependencies (Playwright, agent)
2. Create basic orchestrator and worker scripts
3. Create first test spec
4. Test locally against host localhost

### Phase 2: Containerization (Week 2)
1. Set up Docker Compose
2. Test containerized execution
3. Verify agent works in container
4. Optimize startup times

### Phase 3: CI/CD (Week 3)
1. Set up GitHub Actions workflow
2. Configure secrets and environment
3. Test in CI environment
4. Set up reporting and notifications

### Phase 4: Optimization (Week 4+)
1. Implement cost tracking and limits
2. Add fix caching
3. Optimize performance
4. Add monitoring and analytics

## ⚠️ Important Considerations

### Cost Management
- **Estimate**: ~$0.01-0.05 per LLM fix attempt
- **With 10 specs, 3 retries each**: ~$0.30-1.50 per full run
- **Set daily/weekly limits** to prevent unexpected costs
- **Monitor usage** and adjust retry limits if needed

### Test Data Management
- **Fresh vs. Reused**: Decide if tests need fresh data each run
- **Isolation**: Ensure tests don't interfere with each other
- **Cleanup**: Implement proper cleanup between test runs
- **Seeding**: Create reliable test data seeding scripts

### Network & Dependencies
- **App dependencies**: Ensure app can start in container (database, external services)
- **Stripe test mode**: Use test Stripe keys for payment tests
- **External services**: Mock or use test versions of external APIs
- **Network access**: Verify container can reach required services

### Debugging & Troubleshooting
- **Debug files**: Review `e2e/debug/` when tests fail
- **Logs**: Check container logs for app startup issues
- **Health checks**: Verify app is actually ready before tests run
- **Network**: Test network connectivity in containers

### Security
- **API keys**: Never commit to git (use secrets in CI)
- **Test data**: Don't use real user data or production secrets
- **Sandboxing**: Review security section in architecture doc
- **Code validation**: Ensure LLM-generated code is validated before execution

## 📝 Next Steps

1. **Start with Phase 1**: Get basic setup working locally
2. **Create first spec**: Use the test plan as reference
3. **Test incrementally**: Don't try to implement everything at once
4. **Iterate**: Refine based on actual usage and needs

## 🔗 Reference Documents

- Architecture: `docs/e2e-test-orchestrator-architecture.md`
- Test Plan: `docs/e2e-checkout-test-plan.md`
- Docker Setup: `docker-compose.test.yml.template`
- Spec Template: `e2e/specs/.template.spec.ts`
