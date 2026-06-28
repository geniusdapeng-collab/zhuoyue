'use strict';

/**
 * Cinematic Camera Skill — 电影级运镜控制
 * 封装: CameraMovementSystem v2 (规则驱动) + CameraMovementSystemV4 (LLM驱动)
 *
 * 配置: cameraVersion (v2|v4, default v4)
 * v4 需要注入 LLMGateway
 *
 * 输入: { shots, sceneDescription, cameraVersion, llmGateway }
 * 输出: { cameraMovements, timelineData, cameraLog, versionUsed }
 */

const path = require('path');
const { SkillBase } = require('../skill-base');

const SOURCE_ROOT = path.join(__dirname, '..', '..');

class CinematicCameraSkill extends SkillBase {
  constructor(options = {}) {
    super({
      name: 'cinematic-camera-skill',
      version: '1.0.0',
      description: '电影级运镜控制Skill — v2规则驱动 / v4 LLM驱动',
      category: 'production',
      ...options
    });
    this.cameraVersion = options.cameraVersion || 'v4';
    this.moduleOptions = options.moduleOptions || {};
  }

  async initialize(context) {
    await super.initialize(context);

    // 动态加载 v2
    if (this.cameraVersion === 'v2') {
      try {
        const { CameraMovementSystem } = require(path.join(SOURCE_ROOT, 'systems', 'camera-movement-system-v2.js'));
        this.cameraV2 = new CameraMovementSystem(this.moduleOptions.v2 || {});
      } catch (e) {
        this._emit('skill.initialized', { skillId: this.id, module: 'CameraMovementSystemV2', error: e.message });
      }
    }

    // 动态加载 v4
    if (this.cameraVersion === 'v4') {
      try {
        const { CameraMovementSystemV4 } = require(path.join(SOURCE_ROOT, 'systems', 'camera-movement-system-v4.js'));
        this.cameraV4 = new CameraMovementSystemV4(this.moduleOptions.v4 || {});
      } catch (e) {
        this._emit('skill.initialized', { skillId: this.id, module: 'CameraMovementSystemV4', error: e.message });
      }
    }

    this._emit('skill.initialized', { skillId: this.id, version: this.cameraVersion, status: 'ready' });
    return this;
  }

  async execute(input, context) {
    const traceId = context.traceId || `cc_${Date.now()}`;
    const shots = input.shots || [];
    const sceneDescription = input.sceneDescription || '';
    const version = input.cameraVersion || this.cameraVersion;
    const llmGateway = input.llmGateway || context.llmGateway || null;

    this._emit('skill.executing', { skillId: this.id, traceId, version, shotCount: shots.length });

    const results = {
      cameraMovements: [],
      timelineData: [],
      cameraLog: [],
      versionUsed: version
    };

    if (version === 'v2' && this.cameraV2) {
      for (let i = 0; i < shots.length; i++) {
        try {
          const movement = this.cameraV2.generateMovement(shots[i], sceneDescription);
          results.cameraMovements.push(movement);
          results.cameraLog.push({ shotIndex: i, version: 'v2', type: 'rule-based', status: 'success' });
        } catch (e) {
          results.cameraLog.push({ shotIndex: i, version: 'v2', error: e.message, status: 'failed' });
        }
      }

      try {
        if (typeof this.cameraV2.generateIntraShotTimeline === 'function') {
          for (let i = 0; i < shots.length; i++) {
            const timeline = this.cameraV2.generateIntraShotTimeline(shots[i]);
            results.timelineData.push({ shotIndex: i, timeline });
          }
        }
      } catch (e) {
        this._emit('skill.failed', { skillId: this.id, traceId, phase: 'v2-timeline', error: e.message });
      }
    } else if (version === 'v4' && this.cameraV4) {
      if (llmGateway && typeof this.cameraV4.injectLLMGateway === 'function') {
        try {
          this.cameraV4.injectLLMGateway(llmGateway);
        } catch (e) {
          this._emit('skill.failed', { skillId: this.id, traceId, phase: 'injectLLM', error: e.message });
        }
      }

      for (let i = 0; i < shots.length; i++) {
        try {
          const movement = await this.cameraV4.generateIntraShotTimelineV4(shots[i], sceneDescription);
          results.cameraMovements.push(movement);
          results.timelineData.push({ shotIndex: i, timeline: movement });
          results.cameraLog.push({ shotIndex: i, version: 'v4', type: 'llm-driven', status: 'success' });
        } catch (e) {
          results.cameraLog.push({ shotIndex: i, version: 'v4', error: e.message, status: 'failed' });
        }
      }
    }

    const output = {
      cameraMovements: results.cameraMovements,
      timelineData: results.timelineData,
      cameraLog: results.cameraLog,
      versionUsed: results.versionUsed
    };

    this._emit('skill.completed', { skillId: this.id, traceId, version, movementCount: results.cameraMovements.length });
    return output;
  }

  validate() {
    const checks = [
      { name: `Camera 版本 (${this.cameraVersion}) 已加载`,
        pass: this.cameraVersion === 'v2' ? !!this.cameraV2 : !!this.cameraV4 },
      { name: 'v2 有 generateMovement 方法', pass: this.cameraV2 ? typeof this.cameraV2.generateMovement === 'function' : true },
      { name: 'v4 有 generateIntraShotTimelineV4 方法', pass: this.cameraV4 ? typeof this.cameraV4.generateIntraShotTimelineV4 === 'function' : true }
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
    this.cameraV2 = null;
    this.cameraV4 = null;
    this._emit('skill.shutdown', { skillId: this.id });
  }

  getMetadata() {
    return {
      ...super.getMetadata(),
      inputs: ['shots', 'sceneDescription', 'cameraVersion', 'llmGateway'],
      outputs: ['cameraMovements', 'timelineData', 'cameraLog', 'versionUsed'],
      dependencies: [],
      sourceModules: [
        'systems/camera-movement-system-v2.js',
        'systems/camera-movement-system-v4.js'
      ],
      config: { cameraVersion: this.cameraVersion }
    };
  }

  _emit(eventType, payload) {
    if (this.eventBus) {
      this.eventBus.publish(eventType, payload, { skillId: this.id, source: 'cinematic-camera-skill' });
    }
  }
}

module.exports = { CinematicCameraSkill };
