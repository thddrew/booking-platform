#!/usr/bin/env bun

/**
 * Test LLM Fix Integration
 * 
 * Standalone script to test agent integration
 * Usage: bun run scripts/test-llm-fix.ts
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

async function testCursorAgent() {
	
	console.log('🧪 Testing agent Integration\n');
	
	// Check for API key
	const apiKey = process.env.CURSOR_API_KEY;
	if (!apiKey) {
		console.error('❌ CURSOR_API_KEY not set');
		console.error('   Set it in .env file or as environment variable');
		process.exit(1);
	}
	
	console.log('✅ CURSOR_API_KEY found\n');
	
	// Test agent availability
	console.log('🔍 Checking if agent is available...\n');
	
	const testPrompt = 'Say "Hello, I am agent" if you can read this.';
	
	return new Promise<void>((resolve, reject) => {
		// Agent command format: agent --print --force "prompt"
		// --print flag outputs responses to console for non-interactive use
		// --force flag allows agent to modify files
		const agentProcess = spawn('agent', ['--print', '--force', testPrompt], {
			env: {
				...process.env,
				CURSOR_API_KEY: apiKey,
			},
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		
		let stdout = '';
		let stderr = '';
		
		agentProcess.stdout.on('data', (data) => {
			stdout += data.toString();
		});
		
		agentProcess.stderr.on('data', (data) => {
			stderr += data.toString();
		});
		
		agentProcess.on('close', (code) => {
			if (code === 0 || stdout.trim()) {
				console.log('✅ agent is working!\n');
				console.log('Response:', stdout.substring(0, 200));
				resolve();
			} else {
				console.error('❌ agent test failed');
				console.error(`Exit code: ${code}`);
				if (stderr) {
					console.error(`Error: ${stderr}`);
				}
				reject(new Error('agent test failed'));
			}
		});
		
		agentProcess.on('error', (error) => {
			if (error.message.includes('ENOENT') || (error as any).code === 'ENOENT') {
				console.error('❌ agent command not found');
				console.error('\n💡 Installation:');
				console.error('   curl https://cursor.com/install -fsS | bash');
				console.error('\n💡 Add to PATH (zsh):');
				console.error('   echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.zshrc');
				console.error('   source ~/.zshrc');
				console.error('\n💡 Verify:');
				console.error('   agent --version');
			} else {
				console.error('❌ Error:', error.message);
			}
			reject(error);
		});
		
		// No timeout - let agent run until completion
		// Timeout removed to allow agent to take as long as needed
	});
}

// Run test
testCursorAgent()
	.then(() => {
		console.log('\n✅ LLM integration test passed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ LLM integration test failed:', error.message);
		process.exit(1);
	});
