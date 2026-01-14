# Cursor CLI (agent) Installation

The E2E test orchestrator uses Cursor CLI (`agent`) for LLM-powered test fixes.

## Installation

### macOS, Linux and Windows (WSL)

Install Cursor CLI with a single command:

```bash
curl https://cursor.com/install -fsS | bash
```

## Verification

After installation, verify that Cursor CLI is working correctly:

```bash
agent --version
```

## Post-installation Setup

### Add ~/.local/bin to your PATH

**For zsh (macOS default):**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**For bash:**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## Start Using

```bash
agent
```

## Updates

Cursor CLI will try to auto-update by default to ensure you always have the latest version.

To manually update Cursor CLI to the latest version:

```bash
agent update
# or
agent upgrade
```

Both commands will update Cursor Agent to the latest version.

## Testing Integration

After installation, test that the E2E orchestrator can use agent:

```bash
# Set your API key
export CURSOR_API_KEY=your-api-key-here

# Test integration
bun run test:e2e:llm-test
```

Expected output:
```
🧪 Testing agent Integration

✅ CURSOR_API_KEY found

🔍 Checking if agent is available...

✅ agent is working!

Response: Hello, I am agent
```

## Troubleshooting

### "agent: command not found"

1. **Check if installed:**
   ```bash
   ls ~/.local/bin/agent
   ```

2. **Add to PATH:**
   ```bash
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Verify:**
   ```bash
   agent --version
   ```

### "Permission denied"

Make sure the agent binary is executable:

```bash
chmod +x ~/.local/bin/agent
```

### Still not working?

- Check your shell configuration file (`~/.zshrc` or `~/.bashrc`)
- Restart your terminal
- Try using full path: `~/.local/bin/agent --version`
