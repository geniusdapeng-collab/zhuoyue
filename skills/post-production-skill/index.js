'use strict';

/**
 * Post Production Skill — 后期制作管线
 * 封装: PostProductionPipeline + PostProductionEngine
 *
 * 依赖: commercial-mode-skill（需要品牌元素进行后期合成）
 * 输入: { renderOutput, brand, brandColor, musicPreference, outputPath, subtitleData }
 * 输出: { finalVideo, postProductionLog, versions }
 */

const path = require('path');
const { SkillBase } = require('../skill-base');

const SOURCE_ROOT = path.join(__dirname, '..', '..');

class PostProductionSkill extends SkillBase {
  constructor(options = {}) {
    super({
      name: 'post-production-skill',
      version: '1.0.0',
      description: '后期制作管线Skill — 合并、横版转换、字幕、音乐、多版本输出',
      category: 'post_production',
      ...options
    });
    this.moduleOptions = options.moduleOptions || {};
  }

  async initialize(context) {
    await super.initialize(context);

    try {
      const { PostProductionPipeline } = require(path.join(SOURCE_ROOT, 'systems', 'post-production-pipeline.js'));
      this.pipeline = new PostProductionPipeline(this.moduleOptions.pipeline || {});
    } catch (e) {
      this._emit('skill.initialized', { skillId: this.id, module: 'PostProductionPipeline', error: e.message });
    }

    try {
      const { PostProductionEngine } = require(path.join(SOURCE_ROOT, 'engines', 'post-production-engine', 'post-production-engine.js'));
      this.engine = new PostProductionEngine(this.moduleOptions.engine || {});
    } catch (e) {
      this._emit('skill.initialized', { skillId: this.id, module: 'PostProductionEngine', error: e.message });
    }

    this._emit('skill.initialized', { skillId: this.id, status: 'ready' });
    return this;
  }

  async execute(input, context) {
    const traceId = context.traceId || `pp_${Date.now()}`;
    const renderOutput = input.renderOutput || [];
    const brand = input.brand || {};
    const brandColor = input.brandColor || null;
    const musicPreference = input.musicPreference || null;
    const outputPath = input.outputPath || '';
    const subtitleData = input.subtitleData || [];

    this._emit('skill.executing', { skillId: this.id, traceId, clipCount: renderOutput.length });

    const results = {
      finalVideo: null,
      postProductionLog: [],
      versions: []
    };

    if (this.pipeline) {
      try {
        const pipelineResult = await this.pipeline.produce({
          clips: renderOutput,
          outputPath,
          brandColor,
          subtitles: subtitleData
        });
        results.finalVideo = pipelineResult.outputPath || pipelineResult;
        results.postProductionLog.push({ phase: 'pipeline', status: 'success', result: pipelineResult });
      } catch (e) {
        results.postProductionLog.push({ phase: 'pipeline', status: 'failed', error: e.message });
        this._emit('skill.failed', { skillId: this.id, traceId, phase: 'pipeline', error: e.message });
      }
    }

    if (this.engine) {
      try {
        const engineResult = await this.engine.postProduce({
          videoPath: results.finalVideo || outputPath,
          brand,
          brandColor,
          musicPreference,
          subtitles: subtitleData
        });
        results.versions = engineResult.versions || [engineResult];
        results.postProductionLog.push({ phase: 'engine', status: 'success', result: engineResult });
      } catch (e) {
        results.postProductionLog.push({ phase: 'engine', status: 'failed', error: e.message });
        this._emit('skill.failed', { skillId: this.id, traceId, phase: 'engine', error: e.message });
      }
    }

    const output = {
      finalVideo: results.finalVideo,
      postProductionLog: results.postProductionLog,
      versions: results.versions
    };

    this._emit('skill.completed', { skillId: this.id, traceId, outputKeys: Object.keys(output) });
    return output;
  }

  validate() {
    const checks = [
      { name: 'PostProductionPipeline 已加载', pass: !!this.pipeline },
      { name: 'PostProductionEngine 已加载', pass: !!this.engine },
      { name: 'Pipeline 有 produce 方法', pass: this.pipeline ? typeof this.pipeline.produce === 'function' : false },
      { name: 'Engine 有 postProduce 方法', pass: this.engine ? typeof this.engine.postProduce === 'function' : false }
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
    this.pipeline = null;
    this.engine = null;
    this._emit('skill.shutdown', { skillId: this.id });
  }

  getMetadata() {
    return {
      ...super.getMetadata(),
      inputs: ['renderOutput', 'brand', 'brandColor', 'musicPreference', 'outputPath', 'subtitleData'],
      outputs: ['finalVideo', 'postProductionLog', 'versions'],
      dependencies: ['commercial-mode-skill'],
      sourceModules: [
        'systems/post-production-pipeline.js',
        'engines/post-production-engine/post-production-engine.js'
      ]
    };
  }

  _emit(eventType, payload) {
    if (this.eventBus) {
      this.eventBus.publish(eventType, payload, { skillId: this.id, source: 'post-production-skill' });
    }
  }
}

module.exports = { PostProductionSkill };