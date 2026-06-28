'use strict';

/**
 * Render Pipeline Guard Skill — 渲染流水线强制检查
 * 封装: RenderPipelineGuard + PipelineIntegrityValidator
 *
 * 依赖: prompt-guardian-skill
 * 输入: { shots, characters, pipelineState, outputPath }
 * 输出: { guardResult, integrityResult, canProceed, blockReasons }
 */

const path = require('path');
const { SkillBase } = require('../skill-base');

const SOURCE_ROOT = path.join(__dirname, '..', '..');

class RenderPipelineGuardSkill extends SkillBase {
  constructor(options = {}) {
    super({
      name: 'render-pipeline-guard-skill',
      version: '1.0.0',
      description: 'Render Pipeline Guard + Pipeline Integrity Validator 二合一Skill',
      category: 'production',
      ...options
    });
    this.moduleOptions = options.moduleOptions || {};
  }

  async initialize(context) {
    await super.initialize(context);

    try {
      const { RenderPipelineGuard } = require(path.join(SOURCE_ROOT, 'scripts', 'render-pipeline-guard.js'));
      this.guard = new RenderPipelineGuard(this.moduleOptions.guard || {});
    } catch (e) {
      this._emit('skill.initialized', { skillId: this.id, module: 'RenderPipelineGuard', error: e.message });
    }

    try {
      const { PipelineIntegrityValidator } = require(path.join(SOURCE_ROOT, 'systems', 'pipeline-integrity-validator.js'));
      this.validator = new PipelineIntegrityValidator(this.moduleOptions.validator || {});
    } catch (e) {
      this._emit('skill.initialized', { skillId: this.id, module: 'PipelineIntegrityValidator', error: e.message });
    }

    this._emit('skill.initialized', { skillId: this.id, status: 'ready' });
    return this;
  }

  async execute(input, context) {
    const traceId = context.traceId || `rpg_${Date.now()}`;
    const shots = input.shots || [];
    const characters = input.characters || [];
    const outputPath = input.outputPath || '';

    this._emit('skill.executing', { skillId: this.id, traceId, shotCount: shots.length });

    const results = {
      guard: { passed: true, failures: [] },
      integrity: { valid: true, errors: [], warnings: [] }
    };

    if (this.guard) {
      for (const shot of shots) {
        try {
          const checkResult = this.guard.check(shot, { characters, outputPath });
          if (!checkResult.passed) {
            results.guard.passed = false;
            results.guard.failures.push({ shot, reasons: checkResult.failures });
          }
        } catch (e) {
          results.guard.passed = false;
          results.guard.failures.push({ shot, error: e.message });
        }
      }
    }

    if (this.validator) {
      try {
        const validation = await this.validator.validatePipeline({ shots, characters, outputPath });
        results.integrity.valid = validation.valid;
        results.integrity.errors = validation.errors || [];
        results.integrity.warnings = validation.warnings || [];
      } catch (e) {
        results.integrity.valid = false;
        results.integrity.errors.push({ error: e.message });
      }
    }

    const canProceed = results.guard.passed && results.integrity.valid;
    const blockReasons = [
      ...results.guard.failures.map(f => f.reasons || f.error).flat(),
      ...results.integrity.errors.map(e => e.message || e.error || String(e))
    ].filter(Boolean);

    const output = {
      guardResult: results.guard,
      integrityResult: results.integrity,
      canProceed,
      blockReasons: blockReasons.length ? blockReasons : undefined
    };

    this._emit('skill.completed', { skillId: this.id, traceId, canProceed, blockCount: blockReasons.length });
    return output;
  }

  validate() {
    const checks = [
      { name: 'RenderPipelineGuard 已加载', pass: !!this.guard },
      { name: 'PipelineIntegrityValidator 已加载', pass: !!this.validator },
      { name: 'Guard 有 check 方法', pass: this.guard ? typeof this.guard.check === 'function' : false },
      { name: 'Validator 有 validatePipeline 方法', pass: this.validator ? typeof this.validator.validatePipeline === 'function' : false }
    ];
    const failed = checks.filter(c => !c.pass);
    const healthy = failed.length === 0;

    return {
      healthy,
      component: this.name,
      checks,
      failedChecks: failed.map(c => c.name)
    };
  }

  shutdown() {
    this._emit('skill.shutting_down', { skillId: this.id });
    this.guard = null;
    this.validator = null;
    this._emit('skill.shutdown', { skillId: this.id });
  }

  getMetadata() {
    return {
      ...super.getMetadata(),
      inputs: ['shots', 'characters', 'pipelineState', 'outputPath'],
      outputs: ['guardResult', 'integrityResult', 'canProceed', 'blockReasons'],
      dependencies: ['prompt-guardian-skill'],
      sourceModules: [
        'scripts/render-pipeline-guard.js',
        'systems/pipeline-integrity-validator.js'
      ]
    };
  }

  _emit(eventType, payload) {
    if (this.eventBus) {
      this.eventBus.publish(eventType, payload, { skillId: this.id, source: 'render-pipeline-guard-skill' });
    }
  }
}

module.exports = { RenderPipelineGuardSkill };