'use strict';

const fs = require('fs');
const path = require('path');

async function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile || !outputFile) {
    throw new Error('Usage: node llm-call-isolated-worker.js <inputFile> <outputFile>');
  }

  const input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const {
    prompt,
    options = {}
  } = input;

  const { LLMEngine } = require('../systems/llm-reasoning-engine');

  const engine = new LLMEngine({
    model: options.model || 'kimi-k2p6',
    mode: options.mode || 'production',
    maxRetries: options.maxRetries ?? 0, // 交给外层控制，内部尽量不重试
    maxTokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 1,
    topP: options.topP ?? 0.95
  });

  const result = await engine.generate(prompt, {
    maxTokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 1,
    timeoutMs: options.timeoutMs || 120000
  });

  fs.writeFileSync(outputFile, JSON.stringify({
    success: true,
    result
  }, null, 2), 'utf8');
}

main().catch((err) => {
  const outputFile = process.argv[3];
  try {
    if (outputFile) {
      fs.writeFileSync(outputFile, JSON.stringify({
        success: false,
        error: err.message,
        stack: err.stack
      }, null, 2), 'utf8');
    }
  } catch (_) {}
  process.exit(1);
});
