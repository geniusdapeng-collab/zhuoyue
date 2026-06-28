'use strict';

/**
 * Commercial Mode Skill — 商业广告片专业模式
 * 封装: CommercialMode
 *
 * 输入: { product, brand, sellingPoints, targetAudience, brandColor, adDuration, shots }
 * 输出: { adStructure, enhancedShots, productCameraMoves, markedPhases }
 */

const path = require('path');
const { SkillBase } = require('../skill-base');

const SOURCE_ROOT = path.join(__dirname, '..', '..');

class CommercialModeSkill extends SkillBase {
  constructor(options = {}) {
    super({
      name: 'commercial-mode-skill',
      version: '1.0.0',
      description: '商业广告片专业模式Skill — 产品为剧情服务',
      category: 'pre_production',
      ...options
    });
    this.moduleOptions = options.moduleOptions || {};
  }

  async initialize(context) {
    await super.initialize(context);

    try {
      const { CommercialMode } = require(path.join(SOURCE_ROOT, 'systems', 'commercial-mode.js'));
      this.commercial = new CommercialMode(this.moduleOptions);
    } catch (e) {
      this._emit('skill.initialized', { skillId: this.id, module: 'CommercialMode', error: e.message });
    }

    this._emit('skill.initialized', { skillId: this.id, status: 'ready' });
    return this;
  }

  async execute(input, context) {
    const traceId = context.traceId || `cm_${Date.now()}`;
    const product = input.product || {};
    const brand = input.brand || {};
    const sellingPoints = input.sellingPoints || [];
    const targetAudience = input.targetAudience || '';
    const brandColor = input.brandColor || null;
    const adDuration = input.adDuration || 30;
    const shots = input.shots || [];

    this._emit('skill.executing', { skillId: this.id, traceId, productName: product.name || 'unknown' });

    const results = {
      adStructure: null,
      enhancedShots: [],
      productCameraMoves: [],
      markedPhases: []
    };

    if (this.commercial) {
      try {
        results.adStructure = this.commercial.generateStructure({
          product, brand, sellingPoints, targetAudience, duration: adDuration
        });
      } catch (e) {
        this._emit('skill.failed', { skillId: this.id, traceId, phase: 'generateStructure', error: e.message });
      }

      for (let i = 0; i < shots.length; i++) {
        try {
          const enhanced = this.commercial.enhanceShotPrompt(shots[i], { phase: shots[i].phase || 'solution' });
          results.enhancedShots.push(enhanced);
        } catch (e) {
          results.enhancedShots.push(shots[i]);
        }
      }

      for (let i = 0; i < shots.length; i++) {
        try {
          const phase = this.commercial.markShotPhase(i, shots.length, adDuration);
          results.markedPhases.push({ index: i, phase });
        } catch (e) {
          results.markedPhases.push({ index: i, phase: 'unknown' });
        }
      }

      try {
        results.productCameraMoves = this.commercial.getProductCameraMoves({ product, brandColor });
      } catch (e) {
        this._emit('skill.failed', { skillId: this.id, traceId, phase: 'getProductCameraMoves', error: e.message });
      }
    }

    const output = {
      adStructure: results.adStructure,
      enhancedShots: results.enhancedShots,
      productCameraMoves: results.productCameraMoves,
      markedPhases: results.markedPhases
    };

    this._emit('skill.completed', { skillId: this.id, traceId, outputKeys: Object.keys(output) });
    return output;
  }

  validate() {
    const checks = [
      { name: 'CommercialMode 已加载', pass: !!this.commercial },
      { name: 'CommercialMode 有 generateStructure 方法', pass: this.commercial ? typeof this.commercial.generateStructure === 'function' : false },
      { name: 'CommercialMode 有 enhanceShotPrompt 方法', pass: this.commercial ? typeof this.commercial.enhanceShotPrompt === 'function' : false },
      { name: 'CommercialMode 有 markShotPhase 方法', pass: this.commercial ? typeof this.commercial.markShotPhase === 'function' : false },
      { name: 'CommercialMode 有 getProductCameraMoves 方法', pass: this.commercial ? typeof this.commercial.getProductCameraMoves === 'function' : false }
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
    this.commercial = null;
    this._emit('skill.shutdown', { skillId: this.id });
  }

  getMetadata() {
    return {
      ...super.getMetadata(),
      inputs: ['product', 'brand', 'sellingPoints', 'targetAudience', 'brandColor', 'adDuration', 'shots'],
      outputs: ['adStructure', 'enhancedShots', 'productCameraMoves', 'markedPhases'],
      dependencies: [],
      sourceModules: ['systems/commercial-mode.js']
    };
  }

  _emit(eventType, payload) {
    if (this.eventBus) {
      this.eventBus.publish(eventType, payload, { skillId: this.id, source: 'commercial-mode-skill' });
    }
  }
}

module.exports = { CommercialModeSkill };
