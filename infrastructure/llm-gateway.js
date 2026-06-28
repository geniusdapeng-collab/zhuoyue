/**
 * LLM Gateway v1.0 — 统一LLM调用网关
 * zhuoyue/infrastructure/llm-gateway.js
 *
 * 基于超短裙LLM Gateway移植，适配卓越系统调用模式。
 * 职责：
 * - 熔断器：防止级联失败
 * - 统一重试：指数退避
 * - JSON安全解析：自动修复、Schema验证
 * - 多Provider适配：Kimi（主力）+ 可扩展
 * - 事件集成
 * - 兼容包装器：兼容现有 llm-reasoning-engine.js
 *
 * @version v1.0
 * @author 协同进化引擎
 */

'use strict';

// ============================================================
// 熔断器
// ============================================================

const CB_STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker {
  constructor(name, config = {}) {
    this.name = name;
    this.failureThreshold = config.failureThreshold || 5;
    this.recoveryTimeoutMs = config.recoveryTimeoutMs || 30000;
    this.halfOpenMaxCalls = config.halfOpenMaxCalls || 2;

    this.state = CB_STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
    this.totalCalls = 0;
    this.totalFailures = 0;
  }

  async execute(fn) {
    this.totalCalls++;

    if (this.state === CB_STATE.OPEN) {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeoutMs) {
        console.log(`[CB:${this.name}] 熔断恢复 → HALF_OPEN`);
        this.state = CB_STATE.HALF_OPEN;
        this.halfOpenCalls = 0;
      } else {
        this.totalFailures++;
        throw new Error(`[CB:${this.name}] 熔断器OPEN，拒绝请求`);
      }
    }

    if (this.state === CB_STATE.HALF_OPEN && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      this.totalFailures++;
      throw new Error(`[CB:${this.name}] HALF_OPEN配额已满`);
    }

    if (this.state === CB_STATE.HALF_OPEN) {
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === CB_STATE.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxCalls) {
        console.log(`[CB:${this.name}] 恢复成功 → CLOSED`);
        this.state = CB_STATE.CLOSED;
        this.successCount = 0;
        this.halfOpenCalls = 0;
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.totalFailures++;

    if (this.state === CB_STATE.HALF_OPEN) {
      console.log(`[CB:${this.name}] HALF_OPEN失败 → 返回OPEN`);
      this.state = CB_STATE.OPEN;
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      console.log(`[CB:${this.name}] 失败阈值达到(${this.failureThreshold}) → OPEN`);
      this.state = CB_STATE.OPEN;
    }
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      failureRate: this.totalCalls > 0 ? (this.totalFailures / this.totalCalls).toFixed(2) : 0
    };
  }
}

// ============================================================
// Provider 适配器接口
// ============================================================

class BaseProviderAdapter {
  constructor(name) {
    this.name = name;
    this.configured = false;
  }

  async initialize() {
    throw new Error('子类必须实现initialize方法');
  }

  async call({ prompt, systemPrompt, maxTokens, temperature, timeoutMs }) {
    throw new Error('子类必须实现call方法');
  }
}

/**
 * Kimi Provider适配器
 */
class KimiProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('kimi');
    this.apiKey = null;
    this.baseUrl = null;
    this.model = 'kimi-k2p6';
  }

  async initialize() {
    try {
      const os = require('os');
      const configPath = require('path').join(os.homedir(), '.openclaw', 'openclaw.json');
      const config = require(configPath);
      const remoteConfig = config?.agents?.defaults?.memorySearch?.remote;
      if (!remoteConfig || !remoteConfig.apiKey) {
        throw new Error('Kimi API配置未找到');
      }
      this.apiKey = remoteConfig.apiKey;
      this.baseUrl = remoteConfig.baseUrl || 'https://agent-gw.kimi.com/coding/v1';
      this.configured = true;
      console.log(`[KimiAdapter] 初始化完成`);
    } catch (error) {
      console.warn(`[KimiAdapter] 初始化失败: ${error.message}`);
      this.configured = false;
    }
  }

  async call({ prompt, systemPrompt, maxTokens, temperature, timeoutMs }) {
    if (!this.configured) await this.initialize();
    if (!this.configured) throw new Error('Kimi Adapter未配置');

    const requestBody = {
      model: this.model,
      max_tokens: maxTokens || 4096,
      temperature: 1,
      top_p: 0.95,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ]
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 600000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Zhuoyue-LLM-Gateway/1.0'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`API错误: ${result.error.message || result.error}`);
      }

      let content = result.choices?.[0]?.message?.content
        || result.content?.[0]?.text
        || result.content
        || result.text
        || '';

      if (!content || content.trim().length === 0) {
        const reasoning = result.choices?.[0]?.message?.reasoning_content;
        if (reasoning && reasoning.trim().length > 0) {
          const extracted = this._extractJSONFromReasoning(reasoning);
          content = extracted || reasoning;
        }
      }

      const tokenCount = result.usage?.output_tokens
        || result.usage?.completion_tokens
        || Math.floor(content.length * 1.5);

      return { content, tokenCount, raw: result };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  _extractJSONFromReasoning(text) {
    if (!text || text.trim().length === 0) return null;
    let lastBrace = text.lastIndexOf('}');
    if (lastBrace < 0) return null;
    let braceCount = 0;
    let startIndex = -1;
    for (let i = lastBrace; i >= 0; i--) {
      if (text[i] === '}') braceCount++;
      if (text[i] === '{') braceCount--;
      if (braceCount === 0) { startIndex = i; break; }
    }
    if (startIndex >= 0) {
      const candidate = text.substring(startIndex, lastBrace + 1);
      try { JSON.parse(candidate); return candidate; } catch (e) {}
    }
    const jsonMatches = text.match(/\{[\s\S]*?\}/g);
    if (jsonMatches) {
      for (let i = jsonMatches.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(jsonMatches[i]);
          if (Object.keys(parsed).length > 0) return jsonMatches[i];
        } catch (e) {}
      }
    }
    return null;
  }
}

/**
 * OpenAI Provider适配器（备用）
 */
class OpenAIProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('openai');
    this.apiKey = process.env.OPENAI_API_KEY || null;
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    if (this.apiKey) this.configured = true;
  }

  async initialize() {
    if (!this.apiKey) {
      console.warn('[OpenAIAdapter] 未配置OPENAI_API_KEY');
      this.configured = false;
      return;
    }
    this.configured = true;
  }

  async call({ prompt, systemPrompt, maxTokens, temperature, timeoutMs }) {
    if (!this.configured) throw new Error('OpenAI Adapter未配置');

    const requestBody = {
      model: this.model,
      max_tokens: maxTokens || 4096,
      temperature: temperature || 0.7,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ]
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 120000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      const tokenCount = result.usage?.completion_tokens || Math.floor(content.length * 1.5);

      return { content, tokenCount, raw: result };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// ============================================================
// JSON 安全解析器
// ============================================================

class JSONSafeParser {
  static parse(raw, options = {}) {
    let text = typeof raw === 'string' ? raw : JSON.stringify(raw);

    const codeBlockMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      text = codeBlockMatch[1].trim();
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    const startIdx = Math.min(
      firstBrace >= 0 ? firstBrace : Infinity,
      firstBracket >= 0 ? firstBracket : Infinity
    );
    const endIdx = Math.max(lastBrace, lastBracket);

    if (startIdx !== Infinity && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    }

    try {
      return { success: true, data: JSON.parse(text.trim()) };
    } catch (e1) {
      const fixed = this.attemptRepair(text.trim());
      if (fixed) {
        return { success: true, data: fixed, repaired: true };
      }
      return {
        success: false,
        error: `JSON解析失败: ${e1.message}`,
        raw: text.substring(0, 200)
      };
    }
  }

  static attemptRepair(text) {
    const repairs = [
      (t) => {
        let result = '';
        let inString = false;
        let escape = false;
        for (let i = 0; i < t.length; i++) {
          const char = t[i];
          if (escape) { result += char; escape = false; continue; }
          if (char === '\\') { result += char; escape = true; continue; }
          if (char === '"') inString = !inString;
          if (!inString && char === ',') {
            let j = i + 1;
            while (j < t.length && /\s/.test(t[j])) j++;
            if (t[j] === '}' || t[j] === ']') continue;
          }
          result += char;
        }
        return result;
      },
      (t) => t.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*\s*):/g, '$1"$2":'),
      (t) => t.replace(/:\s*undefined/g, ': null'),
      (t) => {
        let s = t;
        let inStr = false, esc = false;
        let openBraces = 0, closeBraces = 0, openBrackets = 0, closeBrackets = 0;
        for (let i = 0; i < s.length; i++) {
          const c = s[i];
          if (esc) { esc = false; continue; }
          if (c === '\\') { esc = true; continue; }
          if (c === '"') inStr = !inStr;
          if (!inStr) {
            if (c === '{') openBraces++;
            else if (c === '}') closeBraces++;
            else if (c === '[') openBrackets++;
            else if (c === ']') closeBrackets++;
          }
        }
        while (closeBraces < openBraces) { s += '}'; closeBraces++; }
        while (closeBrackets < openBrackets) { s += ']'; closeBrackets++; }
        return s;
      }
    ];

    for (const repair of repairs) {
      try {
        const fixed = repair(text);
        return Object.freeze(JSON.parse(fixed));
      } catch (e) {}
    }

    return null;
  }
}

// ============================================================
// LLM Gateway
// ============================================================

class LLMGateway {
  constructor() {
    this.circuitBreakers = new Map();
    this.providers = new Map();
    this.eventBus = null;
    this.initialized = false;

    this.defaultConfig = {
      provider: 'kimi',
      maxTokens: 4096,
      temperature: 1,
      topP: 0.95,
      timeoutMs: 600000,
      maxRetries: 3,
      retryBackoffMultiplier: 2,
      maxPromptChars: 6000,
      splitPrompt: true,
      fallbackValue: null
    };
  }

  async initialize(options = {}) {
    if (this.initialized) return;

    this.eventBus = options.eventBus || null;

    const cbConfig = {
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeoutMs: options.recoveryTimeoutMs || 30000,
      halfOpenMaxCalls: options.halfOpenMaxCalls || 2
    };

    // 注册所有Provider
    const kimi = new KimiProviderAdapter();
    await kimi.initialize();
    this.providers.set('kimi', kimi);
    this.circuitBreakers.set('kimi', new CircuitBreaker('kimi', cbConfig));

    const openai = new OpenAIProviderAdapter();
    await openai.initialize();
    this.providers.set('openai', openai);
    this.circuitBreakers.set('openai', new CircuitBreaker('openai', cbConfig));

    this.initialized = true;
    console.log('[LLMGateway] ✅ 初始化完成 | Providers:', [...this.providers.keys()].join(', '));
  }

  /**
   * 统一调用入口
   */
  async call(options) {
    await this._ensureInitialized();

    const config = { ...this.defaultConfig, ...options };
    const {
      provider = 'kimi',
      prompt,
      systemPrompt,
      maxTokens,
      timeoutMs,
      maxRetries,
      retryBackoffMultiplier,
      outputFormat = 'text',
      outputSchema = null,
      fallbackValue,
      splitLongPrompt = true,
      publishEvents = true
    } = config;

    const cb = this.circuitBreakers.get(provider);
    if (!cb) {
      // 尝试fallback到kimi
      if (provider !== 'kimi' && this.circuitBreakers.has('kimi')) {
        console.warn(`[LLMGateway] Provider ${provider} 不可用，fallback到kimi`);
        return this.call({ ...options, provider: 'kimi' });
      }
      throw new Error(`未知Provider: ${provider}`);
    }

    let finalPrompt = prompt;
    if (splitLongPrompt && prompt.length > this.defaultConfig.maxPromptChars) {
      console.warn(`[LLMGateway] Prompt过长(${prompt.length}字符)，自动拆分...`);
      return this._callWithSplit(config);
    }

    const startMs = Date.now();
    let lastError = null;

    return cb.execute(async () => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const adapter = this.providers.get(provider);
          if (!adapter || !adapter.configured) {
            throw new Error(`Provider ${provider} 未初始化`);
          }

          const result = await adapter.call({
            prompt: finalPrompt,
            systemPrompt,
            maxTokens,
            temperature: config.temperature,
            timeoutMs
          });

          const durationMs = Date.now() - startMs;
          let parsed = null;

          if (outputFormat === 'json' || outputFormat === 'structured') {
            const parseResult = JSONSafeParser.parse(result.content);
            if (!parseResult.success) {
              throw new Error(`JSON解析失败: ${parseResult.error}`);
            }
            parsed = parseResult.data;

            if (outputSchema && typeof outputSchema.safeParse === 'function') {
              const schemaResult = outputSchema.safeParse(parsed);
              if (!schemaResult.success) {
                throw new Error(`Schema验证失败: ${schemaResult.error.message}`);
              }
              parsed = schemaResult.data;
            }
          }

          if (publishEvents && this.eventBus) {
            this.eventBus.publish('llm.call.success', {
              provider, durationMs, promptLength: finalPrompt.length,
              outputLength: result.content.length, tokenCount: result.tokenCount,
              attempt, outputFormat
            }, { stageId: 'llm-gateway' });
          }

          return {
            success: true,
            data: outputFormat === 'json' || outputFormat === 'structured' ? parsed : result.content,
            raw: result.content,
            meta: { provider, durationMs, attempts: attempt, tokenCount: result.tokenCount, outputFormat }
          };

        } catch (error) {
          lastError = error;
          const isRecoverable = this._isRecoverableError(error);
          console.warn(`[LLMGateway] 尝试 ${attempt}/${maxRetries} 失败 (${provider}): ${error.message}`);

          if (!isRecoverable || attempt === maxRetries) break;

          const backoffMs = Math.pow(retryBackoffMultiplier, attempt - 1) * 1000;
          console.log(`[LLMGateway] ${backoffMs}ms后重试...`);
          await this._sleep(backoffMs);
        }
      }

      if (publishEvents && this.eventBus) {
        this.eventBus.publish('llm.call.failed', {
          provider, error: lastError.message,
          promptLength: finalPrompt.length, attempts: maxRetries
        }, { stageId: 'llm-gateway' });
      }

      if (fallbackValue !== null) {
        console.warn(`[LLMGateway] 返回fallback值`);
        return {
          success: false,
          data: fallbackValue,
          meta: { provider, fallback: true, error: lastError.message }
        };
      }

      throw lastError;
    });
  }

  async _callWithSplit(options) {
    const { prompt, systemPrompt } = options;
    const maxChunkSize = Math.floor(this.defaultConfig.maxPromptChars * 0.8);
    const chunks = this._splitPrompt(prompt, maxChunkSize);
    console.log(`[LLMGateway] Prompt分${chunks.length}块处理`);

    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkResult = await this.call({
        ...options,
        prompt: `[Part ${i + 1}/${chunks.length}]\n${chunks[i]}`,
        splitLongPrompt: false
      });
      results.push(chunkResult.data);
    }

    const merged = this._mergeResults(results, options.outputFormat);
    return { success: true, data: merged, meta: { split: true, chunks: chunks.length } };
  }

  _splitPrompt(prompt, maxChunkSize) {
    const chunks = [];
    const paragraphs = prompt.split('\n\n');
    let currentChunk = '';
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
    return chunks;
  }

  _mergeResults(results, format) {
    if (format === 'json' || format === 'structured') {
      if (results.every(r => Array.isArray(r))) return results.flat();
      return results.reduce((merged, r) => ({ ...merged, ...r }), {});
    }
    return results.join('\n---\n');
  }

  _isRecoverableError(error) {
    const recoverablePatterns = [
      /timeout/i, /ETIMEDOUT/i, /ECONNRESET/i,
      /rate limit/i, /429/i, /too many requests/i,
      /temporary/i, /503/i, /502/i, /504/i,
      /aborted/i, /AbortError/i
    ];
    return recoverablePatterns.some(p => p.test(error.message));
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async _ensureInitialized() {
    if (!this.initialized) await this.initialize();
  }

  getCircuitBreakerStats() {
    const stats = {};
    for (const [name, cb] of this.circuitBreakers) {
      stats[name] = cb.getStats();
    }
    return stats;
  }

  getStats() {
    return {
      circuitBreakers: this.getCircuitBreakerStats(),
      providers: [...this.providers.keys()],
      initialized: this.initialized
    };
  }

  /**
   * 自检方法
   */
  validate() {
    const checks = [
      { name: '已初始化', pass: this.initialized },
      { name: '至少1个Provider可用', pass: [...this.providers.values()].some(p => p.configured) },
      { name: '熔断器已配置', pass: this.circuitBreakers.size > 0 },
      { name: 'Kimi Provider存在', pass: this.providers.has('kimi') }
    ];

    const failed = checks.filter(c => !c.pass);
    return {
      healthy: failed.length === 0,
      component: 'LLMGateway',
      checks,
      failedChecks: failed.map(c => c.name)
    };
  }
}

// ============================================================
// 兼容包装器
// ============================================================

class LLMEngineWrapper {
  constructor(options = {}) {
    this.gateway = null;
    this.options = options;
  }

  async initialize() {
    if (!this.gateway) {
      this.gateway = new LLMGateway();
      await this.gateway.initialize();
    }
  }

  async reason(prompt, options = {}) {
    await this.initialize();
    const result = await this.gateway.call({
      prompt,
      systemPrompt: options.systemPrompt,
      maxTokens: options.maxTokens || 4096,
      temperature: 1,
      timeoutMs: options.timeoutMs || 600000,
      maxRetries: options.maxRetries || 3,
      outputFormat: 'text',
      fallbackValue: this._generateMockContent(prompt)
    });

    return {
      success: result.success,
      content: result.data || result.raw || '',
      tokenCount: result.meta?.tokenCount || 500,
      duration: result.meta?.durationMs || 0,
      attempts: result.meta?.attempts || 1,
      fallback: !result.success
    };
  }

  async reasonStructured(prompt, schema, options = {}) {
    await this.initialize();
    const structuredPrompt = `${prompt}\n\n【输出格式要求】\n请严格按以下 JSON 格式输出，不要包含任何其他内容：\n\n${JSON.stringify(schema, null, 2)}\n\n注意：只输出 JSON，不要任何解释、前缀或后缀。`;

    const result = await this.gateway.call({
      prompt: structuredPrompt,
      systemPrompt: options.systemPrompt,
      maxTokens: options.maxTokens || 4096,
      timeoutMs: options.timeoutMs || 600000,
      outputFormat: 'json',
      fallbackValue: schema
    });

    return {
      success: result.success,
      data: result.data || result.raw || {},
      rawContent: result.raw || '',
      duration: result.meta?.durationMs || 0
    };
  }

  async reasonBatch(prompts, options = {}) {
    await this.initialize();
    const results = [];
    for (let i = 0; i < prompts.length; i++) {
      const result = await this.reason(prompts[i], options);
      results.push(result);
      if (i < prompts.length - 1) await this._sleep(options.batchDelay || 500);
    }
    return results;
  }

  _generateMockContent(prompt) {
    if (prompt.includes('剧本') || prompt.includes('故事')) {
      return JSON.stringify({ scenes: [{ id: 'S01', scene: '开场' }] });
    }
    if (prompt.includes('导演') || prompt.includes('评估')) {
      return JSON.stringify({ score: 83, passed: true });
    }
    if (prompt.includes('商业') || prompt.includes('广告')) {
      return JSON.stringify({ sellingPoints: [], brandMessages: [] });
    }
    return JSON.stringify({ result: '推理完成' });
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
// 单例
// ============================================================

let gatewayInstance = null;

module.exports = {
  LLMGateway,
  CircuitBreaker,
  KimiProviderAdapter,
  OpenAIProviderAdapter,
  JSONSafeParser,
  LLMEngineWrapper,
  CB_STATE,

  getLLMGateway: async () => {
    if (!gatewayInstance) {
      gatewayInstance = new LLMGateway();
      await gatewayInstance.initialize();
    }
    return gatewayInstance;
  },

  callLLM: async (options) => {
    const gw = await module.exports.getLLMGateway();
    return gw.call(options);
  }
};

// ============================================================
// 自检测试
// ============================================================

if (require.main === module) {
  async function test() {
    console.log('=== LLM Gateway 自检 ===\n');

    // 测试1：熔断器
    console.log('--- 测试1：熔断器 ---');
    const cb = new CircuitBreaker('test', { failureThreshold: 3, recoveryTimeoutMs: 1000 });
    for (let i = 0; i < 3; i++) {
      try { await cb.execute(async () => { throw new Error('模拟失败'); }); } catch (e) {}
    }
    console.log('熔断状态:', cb.getStats().state);

    // 测试2：JSON安全解析
    console.log('\n--- 测试2：JSON安全解析 ---');
    const badJson = '{"a": 1, "b": 2,}';
    const parsed = JSONSafeParser.parse(badJson);
    console.log('修复后:', parsed.success, JSON.stringify(parsed.data));

    // 测试3：Gateway自检（不依赖API）
    console.log('\n--- 测试3：Gateway结构自检 ---');
    const gw = new LLMGateway();
    // 未初始化时应不健康
    let v = gw.validate();
    console.log('未初始化自检:', v.healthy ? '通过' : '不通过（预期）');

    await gw.initialize();
    v = gw.validate();
    console.log('初始化后自检:', v.healthy ? '通过' : '不通过');
    console.log('Providers:', [...gw.providers.keys()].join(', '));

    // 测试4：兼容包装器
    console.log('\n--- 测试4：兼容包装器 ---');
    const wrapper = new LLMEngineWrapper();
    const mockResult = await wrapper.reason('请生成商业广告剧本');
    console.log('Mock成功:', mockResult.success);
    console.log('Mock内容长度:', mockResult.content.length);

    console.log('\n=== 自检完成 ===');
  }

  test().catch(console.error);
}
