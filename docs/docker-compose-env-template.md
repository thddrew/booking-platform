# Docker Compose Environment Variables Template

Environment variables for E2E test Docker Compose setup.

**Usage:**
1. Copy these variables to `.env.test` file
2. Customize values for your environment
3. `docker-compose -f docker-compose.test.yml` will automatically use `.env.test`

```bash
# ============================================================================
# Database Configuration
# ============================================================================
POSTGRES_DB=test_db
POSTGRES_USER=test_user
POSTGRES_PASSWORD=test_password
POSTGRES_PORT=5432

# ============================================================================
# Application Configuration
# ============================================================================
APP_PORT=4000
DATABASE_URL=postgresql://test_user:test_password@postgres:5432/test_db
NODE_ENV=test

# Add any other required app environment variables
# NEXT_PUBLIC_API_URL=http://app:4000
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...

# ============================================================================
# Test Configuration
# ============================================================================
# Maximum number of parallel test workers
MAX_WORKERS=5

# Test timeout per spec (milliseconds)
TIMEOUT=180000

# Maximum retries per spec
MAX_RETRIES=3

# Keep all debug files (even for successful tests)
DEBUG_KEEP_ALL=false

# ============================================================================
# LLM API Configuration
# ============================================================================
# Required for LLM auto-fix functionality
# 
# How to get your API key:
#   1. Go to Cursor dashboard: https://cursor.com
#   2. Navigate to: Integrations > User API Keys
#   3. Create a new API key
#   4. Copy the key (you'll only see it once)
#   5. Paste it here or set as environment variable
#
# Security:
#   - Never commit this file to git (.env.test should be in .gitignore)
#   - Use CI/CD secrets for automated runs
#   - Rotate keys periodically
#
CURSOR_API_KEY=your-cursor-api-key-here

# ============================================================================
# CI/CD Configuration
# ============================================================================
# Set to true in CI environments
CI=false

# ============================================================================
# Optional: Override Base URL
# ============================================================================
# If you want to test against a different URL (e.g., staging)
# BASE_URL=https://staging.example.com
```
