# LLM Fix Integration Guide

## Overview

The E2E test orchestrator uses `agent` CLI (Cursor CLI) to automatically fix failing tests through strategy-level adjustments.

## How It Works

1. **Test Fails**: Test execution fails with an error
2. **Debug Collection**: Worker collects debug info (DOM, elements, console logs, etc.)
3. **LLM Analysis**: `agent` is called with:
   - Test spec goal and steps
   - Current test code
   - Error details and category
   - Debug file locations
4. **Fix Generation**: LLM proposes a strategy-level fix
5. **Fix Application**: Fix is applied to test code
6. **Retry**: Test is retried with fixed code

## Requirements

### 1. Cursor API Key

Get your API key from:
- Cursor Dashboard: https://cursor.com
- Navigate to: **Integrations** > **User API Keys**
- Create a new API key
- Add to `.env` file: `CURSOR_API_KEY=your-key-here`

### 2. Cursor CLI (agent)

The `agent` command must be available in your PATH.

**Installation:**
```bash
# macOS, Linux, Windows (WSL)
curl https://cursor.com/install -fsS | bash
```

**Add to PATH (zsh):**
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Verify installation:**
```bash
agent --version
```

**Test integration:**
```bash
bun run test:e2e:llm-test
```

## Implementation Details

### Error Categorization

Errors are automatically categorized to guide fix strategy:

- **SelectorNotFound**: Element not found → Find alternative selectors
- **TimingAsync**: Timeout issues → Add explicit waits
- **ElementState**: Element not visible/enabled → Wait for state
- **Navigation**: Navigation failures → Retry navigation
- **Assertion**: Assertion failures → Adjust assertions
- **Network**: Network errors → Handle network issues
- **LogicApplication**: Application errors → Verify app state

### Fix Strategy

The LLM focuses on **strategy-level fixes**:

**✅ Strategy-Level (Preferred):**
- Different navigation approach
- Different waiting strategy
- Different element selection method
- Handle dynamic content differently

**❌ Code-Level (Fallback):**
- Only selector value changes
- Syntax fixes
- Typo corrections

### Response Parsing

The system handles multiple response formats:

1. **JSON Format** (Preferred):
   ```json
   {
     "originalCode": "...",
     "proposedFix": "...",
     "strategyChange": "..."
   }
   ```

2. **Markdown Code Blocks**:
   ```typescript
   // LLM returns code in markdown blocks
   ```

3. **Plain Text**: Extracts code patterns from text

4. **Keyword Extraction**: Finds "originalCode" and "proposedFix" in response

## Usage

### Automatic (Default)

LLM fixes are automatically attempted when tests fail:

```bash
bun run test:e2e:orchestrate
```

### Manual Testing

Test LLM integration separately:

```bash
# Test agent availability
bun run test:e2e:llm-test

# Run single test with LLM fixes
bun run scripts/test-worker.ts e2e/specs/create-free-booking.spec.ts
```

## Troubleshooting

### "agent command not found"

**Solutions:**
1. Install Cursor CLI: `curl https://cursor.com/install -fsS | bash`
2. Add to PATH: `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc`
3. Verify: `agent --version`
4. Check Cursor documentation for troubleshooting

### "CURSOR_API_KEY not set"

**Solutions:**
1. Add to `.env` file
2. Or set as environment variable
3. Verify key is valid in Cursor dashboard

### "LLM fix failed"

**Possible causes:**
- API key invalid or expired
- Network issues
- agent timeout
- Invalid response format

**Check:**
- Test with: `bun run test:e2e:llm-test`
- Review debug files in `e2e/debug/`
- Check agent logs

### LLM Returns Invalid Fix

**Handling:**
- System attempts to parse multiple formats
- Falls back to code block extraction
- If all parsing fails, test continues without fix
- Debug files saved for manual review

## Cost Considerations

- **Estimated cost**: ~$0.01-0.05 per LLM fix attempt
- **With 10 specs, 3 retries each**: ~$0.30-1.50 per full run
- **Cost tracking**: Reported in test execution report
- **Optimization**: Fix caching (future enhancement)

## Best Practices

1. **Test LLM Integration First**: Run `bun run test:e2e:llm-test` before running full suite
2. **Monitor Costs**: Review cost estimates in reports
3. **Review Fixes**: Check proposed fixes in reports before applying manually
4. **Debug Files**: Review `e2e/debug/` when fixes don't work
5. **API Key Security**: Never commit API keys to git

## Future Enhancements

- Fix caching to reduce API calls
- Fix library of common patterns
- Better response parsing with AST
- Cost optimization strategies
- Fix validation before application
