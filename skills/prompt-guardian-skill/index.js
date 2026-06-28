/**
 * Prompt Guardian Skill — 自动修复与防护
 * zhuoyue/skills/prompt-guardian-skill/index.js
 *
 * 封装：scripts/prompt-guardian.js + systems/prompt-standard-v3.js + systems/prompt-standardizer.js
 * 输入：原始prompt（字符串或对象）
 * 输出：修复后的prompt + 修复日志
 */

'use strict';

const path = require('path');
const { SkillBase } = require('../skill-base');

class PromptGuardianSkill extends SkillBase {
  constructor(config = {}) {
    super({
      id: config.id || 'prompt-guardian-skill',
      name: 'PromptGuardianSkill',
      version: '1.0.0',
      description: 'Prompt自动修复与防护 — 服装锁定、外观锚定、敏感词过滤、引用格式修正',
      dependencies: config.dependencies || [],
      category: 'pre_production',
      ...config
    });
    this.guardian = null;
    this.standardV3 = null;
    this.standardizer = null;
  }

  async onInitialize(options = {}) {
    const scriptsDir = path.join(__dirname, '..', '..', 'scripts');
    const systemsDir = path.join(__dirname, '..', '..', 'systems');

    try {
      const { PromptGuardian } = require(path.join(scriptsDir, 'prompt-guardian.js'));
      this.guardian = new PromptGuardian(options.guardian || {});
    } catch (e) {
      console.warn(`[PromptGuardianSkill] 无法加载prompt-guardian.js: ${e.message}`);
    }

    try {
      this.standardV3 = require(path.join(systemsDir, 'prompt-standard-v3.js'));
    } catch (e) {
      console.warn(`[PromptGuardianSkill] 无法加载prompt-standard-v3.js: ${e.message}`);
    }

    try {
      const { normalizePrompt } = require(path.join(systemsDir, 'prompt-standardizer.js'));
      this.standardizer = normalizePrompt;
    } catch (e) {
      console.warn(`[PromptGuardianSkill] 无法加载prompt-standardizer.js: ${e.message}`);
    }

    return true;
  }

  async onExecute(input, context = {}) {
    const prompt = input.prompt || (input.prompts ? input.prompts[0] : null);
    if (!prompt) {
      throw new Error('PromptGuardianSkill: 输入缺少prompt或prompts字段');
    }
    const options = input.options || {};

    let currentPrompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
    const fixLog = [];

    if (this.standardizer) {
      try {
        const normalized = this.standardizer(currentPrompt, options.standardizer);
        if (normalized !== currentPrompt) {
          fixLog.push({ step: 'standardizer', from: currentPrompt.length, to: normalized.length });
          currentPrompt = normalized;
        }
      } catch (e) {
        fixLog.push({ step: 'standardizer', error: e.message });
      }
    }

    if (this.standardV3 && typeof this.standardV3.fix === 'function') {
      try {
        const fixed = await this.standardV3.fix(currentPrompt, options.standardV3);
        if (fixed && fixed.prompt !== currentPrompt) {
          fixLog.push({ step: 'standardV3', issues: fixed.issues || [] });
          currentPrompt = fixed.prompt;
        }
      } catch (e) {
        fixLog.push({ step: 'standardV3', error: e.message });
      }
    }

    if (this.guardian && typeof this.guardian.guard === 'function') {
      try {
        const guarded = await this.guardian.guard(currentPrompt, options.guardian);
        if (guarded && guarded.prompt !== currentPrompt) {
          fixLog.push({ step: 'guardian', changes: guarded.changes || [] });
          currentPrompt = guarded.prompt;
        }
      } catch (e) {
        fixLog.push({ step: 'guardian', error: e.message });
      }
    }

    if (this.eventBus) {
      this.eventBus.publish('prompt.guardian.completed', {
        skillId: this.id,
        fixCount: fixLog.length,
        fixSteps: fixLog.map(f => f.step)
      }, { traceId: context.traceId });
    }

    return {
      prompt: currentPrompt,
      fixLog,
      fixed: fixLog.length > 0
    };
  }

  onValidate(data, type) {
    const errors = [];
    if (!data) {
      return { valid: true, errors };
    }
    if (type === 'input') {
      if (!data.prompt && (!data.prompts || !data.prompts.length)) {
        errors.push('输入缺少prompt或prompts字段');
      }
    } else if (type === 'output') {
      if (!data.prompt) errors.push('输出缺少prompt字段');
      if (typeof data.prompt !== 'string') errors.push('输出prompt必须是字符串');
    }
    return { valid: errors.length === 0, errors };
  }

  validate(data, type) {
    if (arguments.length === 0) {
      const checks = [
        { name: 'PromptGuardian 已加载', pass: !!this.guardian },
        { name: 'StandardV3 已加载', pass: !!this.standardV3 },
        { name: 'Standardizer 已加载', pass: !!this.standardizer },
        { name: 'Guardian 有 guard 方法', pass: this.guardian ? typeof this.guardian.guard === 'function' : false },
        { name: 'StandardV3 有 parsePrompt 方法', pass: this.standardV3 ? typeof this.standardV3.parsePrompt === 'function' : false },
        { name: 'Standardizer 有 normalizePrompt 方法', pass: this.standardizer ? typeof this.standardizer === 'function' : false }
      ];
      const failed = checks.filter(c => !c.pass);
      return { healthy: failed.length === 0, checks, failedChecks: failed.map(c => c.name) };
    }
    return super.validate(data, type);
  }

  getMetadata() {
    return {
      ...super.getMetadata(),
      inputs: ['prompt', 'prompts'],
      outputs: ['prompt', 'fixLog', 'fixed'],
      dependencies: [],
      sourceModules: [
        'scripts/prompt-guardian.js',
        'systems/prompt-standard-v3.js',
        'systems/prompt-standardizer.js'
      ]
    };
  }
}

module.exports = { PromptGuardianSkill };
