'use strict';

/**
 * Continuity Engine Skill — 镜头连续性检查
 * 封装: ContinuityEngine
 *
 * 依赖: cinematic-camera-skill（需要运镜数据来检查连续性）
 * 输入: { shots, cameraMovements, mode }
 * 输出: { continuityReport, transitionSuggestions, issues, overallScore }
 */

const path = require('path');
const { SkillBase } = require('../skill-base');

const SOURCE_ROOT = path.join(__dirname, '..', '..');

class ContinuityEngineSkill extends SkillBase {
  constructor(options = {}) {
    super({
      name: 'continuity-engine-skill',
      version: '1.0.0',
      description: '连续性引擎Skill — 检查镜头转场连贯性、运镜一致性、景别合法性',
      category: 'post_production',
      ...options
    });
    this.moduleOptions = options.moduleOptions || {};
  }

  async initialize(context) {
    await super.initialize(context);

    try {
      const { ContinuityEngine } = require(path.join(SOURCE_ROOT, 'systems', 'continuity-engine.js'));
      this.engine = new ContinuityEngine(this.moduleOptions);
    } catch (e) {
      this._emit('skill.initialized', { skillId: this.id, module: 'ContinuityEngine', error: e.message });
    }

    this._emit('skill.initialized', { skillId: this.id, status: 'ready' });
    return this;
  }

  async execute(input, context) {
    const traceId = context.traceId || `ce_${Date.now()}`;
    const shots = input.shots || [];
    const cameraMovements = input.cameraMovements || [];
    const mode = input.mode || 'nirath';

    this._emit('skill.executing', { skillId: this.id, traceId, shotCount: shots.length, mode });

    const results = {
      continuityReport: [],
      transitionSuggestions: [],
      issues: [],
      overallScore: 1.0
    };

    if (this.engine && shots.length > 1) {
      for (let i = 0; i < shots.length - 1; i++) {
        const shotA = shots[i];
        const shotB = shots[i + 1];
        const moveA = cameraMovements[i] || {};
        const moveB = cameraMovements[i + 1] || {};

        try {
          const analysis = this.engine.analyze(shotA, shotB, {
            movementA: moveA,
            movementB: moveB,
            mode
          });

          results.continuityReport.push({
            pairIndex: i,
            shotA: shotA.id || i,
            shotB: shotB.id || (i + 1),
            analysis
          });

          if (analysis.issues && analysis.issues.length) {
            results.issues.push(...analysis.issues.map(issue => ({
              ...issue,
              pairIndex: i,
              shotA: shotA.id || i,
              shotB: shotB.id || (i + 1)
            })));
          }

          if (analysis.suggestedTransition) {
            results.transitionSuggestions.push({
              pairIndex: i,
              transition: analysis.suggestedTransition,
              reason: analysis.transitionReason
            });
          }
        } catch (e) {
          results.issues.push({
            pairIndex: i,
            type: 'error',
            message: e.message,
            shotA: shotA.id || i,
            shotB: shotB.id || (i + 1)
          });
        }
      }

      const totalPairs = shots.length - 1;
      const errorCount = results.issues.filter(i => i.type !== 'warning').length;
      const warningCount = results.issues.filter(i => i.type === 'warning').length;
      results.overallScore = totalPairs
        ? Math.max(0, 1 - (errorCount * 0.3 + warningCount * 0.1) / totalPairs)
        : 1.0;
    }

    const output = {
      continuityReport: results.continuityReport,
      transitionSuggestions: results.transitionSuggestions,
      issues: results.issues,
      overallScore: results.overallScore
    };

    this._emit('skill.completed', { skillId: this.id, traceId, pairCount: results.continuityReport.length, score: results.overallScore });
    return output;
  }

  validate() {
    const checks = [
      { name: 'ContinuityEngine 已加载', pass: !!this.engine },
      { name: 'ContinuityEngine 有 analyze 方法', pass: this.engine ? typeof this.engine.analyze === 'function' : false }
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
    this.engine = null;
    this._emit('skill.shutdown', { skillId: this.id });
  }

  getMetadata() {
    return {
      ...super.getMetadata(),
      inputs: ['shots', 'cameraMovements', 'mode'],
      outputs: ['continuityReport', 'transitionSuggestions', 'issues', 'overallScore'],
      dependencies: ['cinematic-camera-skill'],
      sourceModules: ['systems/continuity-engine.js']
    };
  }

  _emit(eventType, payload) {
    if (this.eventBus) {
      this.eventBus.publish(eventType, payload, { skillId: this.id, source: 'continuity-engine-skill' });
    }
  }
}

module.exports = { ContinuityEngineSkill };
