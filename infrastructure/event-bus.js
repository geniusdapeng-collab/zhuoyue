/**
 * Commercial Event Bus v2.0 — 商业广告片专用事件总线
 * zhuoyue/infrastructure/event-bus.js
 *
 * 基于超短裙Event Bus v2.0移植，扩展商业广告特有事件Schema。
 * 职责：
 * - 发布/订阅事件
 * - Mutations追踪
 * - 事件回放
 * - 商业广告特有事件定义
 *
 * @version v2.0
 * @author 协同进化引擎
 */

'use strict';

const EventEmitter = require('events');

// ============================================================
// 商业广告事件定义
// ============================================================

const COMMERCIAL_EVENT_DEFINITIONS = {
  // Pipeline 生命周期
  'pipeline.started': {
    description: 'Pipeline开始执行',
    requiredFields: ['traceId', 'stageCount']
  },
  'pipeline.milestone': {
    description: 'Pipeline达到里程碑',
    requiredFields: ['phase', 'stage', 'progressPercent']
  },
  'pipeline.completed': {
    description: 'Pipeline成功完成',
    requiredFields: ['traceId', 'completedCount']
  },
  'pipeline.failed': {
    description: 'Pipeline失败',
    requiredFields: ['traceId', 'failedAt', 'error']
  },

  // Stage 生命周期
  'stage.started': {
    description: 'Stage开始执行',
    requiredFields: ['stageId', 'traceId']
  },
  'stage.completed': {
    description: 'Stage成功完成',
    requiredFields: ['stageId', 'traceId', 'status']
  },
  'stage.failed': {
    description: 'Stage失败',
    requiredFields: ['stageId', 'traceId', 'error']
  },
  'stage.skipped': {
    description: 'Stage被跳过',
    requiredFields: ['stageId', 'traceId', 'reason']
  },
  'stage.compensated': {
    description: 'Stage补偿已执行',
    requiredFields: ['stageId', 'traceId']
  },

  // Skill 生命周期
  'skill.initializing': { description: 'Skill初始化中', requiredFields: ['skillId'] },
  'skill.initialized': { description: 'Skill初始化完成', requiredFields: ['skillId'] },
  'skill.executing': { description: 'Skill执行中', requiredFields: ['skillId'] },
  'skill.completed': { description: 'Skill执行完成', requiredFields: ['skillId'] },
  'skill.failed': { description: 'Skill执行失败', requiredFields: ['skillId', 'error'] },
  'skill.validated': { description: 'Skill验证完成', requiredFields: ['skillId', 'valid'] },
  'skill.shutting_down': { description: 'Skill关闭中', requiredFields: ['skillId'] },
  'skill.shutdown': { description: 'Skill已关闭', requiredFields: ['skillId'] },

  // LLM 调用事件
  'llm.call.success': {
    description: 'LLM调用成功',
    requiredFields: ['provider', 'durationMs']
  },
  'llm.call.failed': {
    description: 'LLM调用失败',
    requiredFields: ['provider', 'error']
  },

  // 数据变更事件
  'data.mutated': {
    description: '数据字段被修改',
    requiredFields: ['stageId', 'field']
  },
  'data.validated': {
    description: '数据验证完成',
    requiredFields: ['stageId', 'valid']
  },

  // ===== 商业广告特有事件 =====

  // 产品分析
  'commercial.product.analyzed': {
    description: '产品分析完成',
    requiredFields: ['productName', 'sellingPoints', 'targetAudience']
  },
  'commercial.sellingpoint.extracted': {
    description: '卖点提取完成',
    requiredFields: ['productName', 'sellingPoints']
  },
  'commercial.benefit.mapped': {
    description: '卖点-利益映射完成',
    requiredFields: ['productName', 'benefitMap']
  },

  // 品牌元素
  'brand.color.injected': {
    description: '品牌色彩注入完成',
    requiredFields: ['brandName', 'colors', 'injectionPoints']
  },
  'brand.logo.placed': {
    description: '品牌Logo放置完成',
    requiredFields: ['brandName', 'placement', 'timestamp']
  },
  'brand.voice.applied': {
    description: '品牌语调应用完成',
    requiredFields: ['brandName', 'voiceProfile']
  },
  'brand.guideline.enforced': {
    description: '品牌规范强制执行',
    requiredFields: ['brandName', 'guidelines', 'violations']
  },

  // 广告结构
  'ad.structure.generated': {
    description: '广告结构生成完成',
    requiredFields: ['structureType', 'acts', 'duration']
  },
  'ad.hook.crafted': {
    description: '钩子设计完成',
    requiredFields: ['hookType', 'duration', 'impact']
  },
  'ad.calltoaction.placed': {
    description: 'CTA放置完成',
    requiredFields: ['placement', 'ctaText', 'timestamp']
  },

  // 合规检查
  'compliance.legal.checked': {
    description: '法律合规检查',
    requiredFields: ['passed', 'issues']
  },
  'compliance.platform.checked': {
    description: '平台规范检查',
    requiredFields: ['platform', 'passed', 'issues']
  },
  'compliance.medical.checked': {
    description: '医疗广告合规检查',
    requiredFields: ['passed', 'medicalClaims', 'warnings']
  }
};

// ============================================================
// Mutations 追踪器
// ============================================================

class MutationTracker {
  constructor() {
    this.mutations = new Map();
  }

  record(traceId, { stageId, shotId, field, previousValue, newValue }) {
    const mutation = {
      timestamp: Date.now(),
      stageId,
      shotId,
      field,
      previousHash: this._hashValue(previousValue),
      newHash: this._hashValue(newValue),
      sizeDelta: this._calculateSizeDelta(previousValue, newValue)
    };

    if (!this.mutations.has(traceId)) {
      this.mutations.set(traceId, []);
    }
    this.mutations.get(traceId).push(mutation);
    return mutation;
  }

  getHistory(traceId, filters = {}) {
    const all = this.mutations.get(traceId) || [];
    if (filters.stageId) return all.filter(m => m.stageId === filters.stageId);
    if (filters.shotId) return all.filter(m => m.shotId === filters.shotId);
    if (filters.field) return all.filter(m => m.field === filters.field);
    return all;
  }

  detectAnomalies(traceId, expectedStagesPerField = {}) {
    const anomalies = [];
    const history = this.mutations.get(traceId) || [];
    for (const mutation of history) {
      const expectedStages = expectedStagesPerField[mutation.field] || [];
      if (expectedStages.length > 0 && !expectedStages.includes(mutation.stageId)) {
        anomalies.push({ ...mutation, expectedStages, severity: 'warning' });
      }
    }
    return anomalies;
  }

  _hashValue(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') {
      return value.length > 50 ? `str_${value.length}_${value.substring(0, 20)}...` : `str_${value}`;
    }
    return `obj_${JSON.stringify(value).length}`;
  }

  _calculateSizeDelta(prev, next) {
    const prevSize = prev ? JSON.stringify(prev).length : 0;
    const nextSize = next ? JSON.stringify(next).length : 0;
    return nextSize - prevSize;
  }

  clear(traceId) {
    this.mutations.delete(traceId);
  }
}

// ============================================================
// Event Bus v2.0
// ============================================================

class CommercialEventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = options.name || 'commercial-event-bus';
    this.enabled = options.enabled !== false;
    this.debug = options.debug || false;
    this.maxListeners = options.maxListeners || 100;
    this.setMaxListeners(this.maxListeners);

    this.eventLog = [];
    this.maxLogSize = options.maxLogSize || 10000;
    this.mutationTracker = new MutationTracker();
    this.subscriberStats = {};
    this.errorLog = [];
    this.maxErrorLogSize = 1000;

    if (!this.enabled) {
      console.log(`[EventBus:${this.name}] 已禁用`);
    } else {
      console.log(`[EventBus:${this.name}] 初始化完成 | mutations追踪:启用 | 最大日志:${this.maxLogSize}`);
    }
  }

  /**
   * 发布事件
   */
  publish(eventType, payload, metadata = {}) {
    if (!this.enabled) return;

    const eventDef = COMMERCIAL_EVENT_DEFINITIONS[eventType];
    if (!eventDef) {
      console.warn(`[EventBus] 未知事件类型: ${eventType}`);
    }

    if (eventDef && eventDef.requiredFields) {
      for (const field of eventDef.requiredFields) {
        if (payload[field] === undefined || payload[field] === null) {
          console.warn(`[EventBus] 事件 ${eventType} 缺少必填字段: ${field}`);
        }
      }
    }

    const event = {
      type: eventType,
      payload: metadata.clonePayload ? this._deepClone(payload) : payload,
      mutations: metadata.mutations || [],
      metadata: {
        timestamp: Date.now(),
        busName: this.name,
        traceId: metadata.traceId || payload.traceId || `evt_${Date.now()}`,
        ...metadata
      }
    };

    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    if (this.debug) {
      console.log(`[EventBus] 📤 发布 ${eventType}`,
        Object.keys(payload).map(k => `${k}=${typeof payload[k]}`).join(', '));
    }

    this.emit(eventType, event);
  }

  /**
   * 订阅事件
   */
  subscribe(eventType, handler, options = {}) {
    if (!this.enabled) return () => {};

    const subscriberId = `${eventType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (!this.subscriberStats[eventType]) {
      this.subscriberStats[eventType] = { subscribers: 0, invocations: 0, errors: 0 };
    }

    const currentListeners = this.listenerCount(eventType);
    if (currentListeners >= this.maxListeners) {
      console.warn(`[EventBus] ⚠️ 事件 ${eventType} 监听器已达上限(${this.maxListeners})`);
      return () => {};
    }

    this.subscriberStats[eventType].subscribers++;

    const wrapper = async (event) => {
      try {
        this.subscriberStats[eventType].invocations++;
        if (this.debug) {
          console.log(`[EventBus] 📥 订阅者 ${subscriberId} 处理 ${eventType}`);
        }
        const result = options.async !== false
          ? await handler(event.payload, event.metadata, event.mutations)
          : handler(event.payload, event.metadata, event.mutations);
        return result;
      } catch (e) {
        this.subscriberStats[eventType].errors++;
        this.errorLog.push({
          timestamp: Date.now(),
          eventType,
          subscriberId,
          error: e.message
        });
        if (this.errorLog.length > this.maxErrorLogSize) {
          this.errorLog.shift();
        }
        console.error(`[EventBus] 订阅者 ${subscriberId} 处理 ${eventType} 异常:`, e.message);
        if (options.throwErrors) {
          process.emit('uncaughtException', e);
        }
      }
    };

    if (options.once) {
      this.once(eventType, wrapper);
    } else {
      this.on(eventType, wrapper);
    }

    return () => {
      this.off(eventType, wrapper);
      if (this.subscriberStats[eventType] && this.subscriberStats[eventType].subscribers > 0) {
        this.subscriberStats[eventType].subscribers--;
      }
    };
  }

  /**
   * 等待事件
   */
  waitFor(eventType, timeoutMs = 5000) {
    if (!this.enabled) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(eventType, handler);
        reject(new Error(`等待事件 ${eventType} 超时 ${timeoutMs}ms`));
      }, timeoutMs);
      const handler = (event) => {
        clearTimeout(timer);
        resolve(event);
      };
      this.once(eventType, handler);
    });
  }

  // ============================================================
  // 事件回放
  // ============================================================

  getEventLog(filters = {}) {
    let filtered = [...this.eventLog];
    if (filters.eventType) filtered = filtered.filter(e => e.type === filters.eventType);
    if (filters.traceId) filtered = filtered.filter(e => e.metadata.traceId === filters.traceId);
    if (filters.stageId) filtered = filtered.filter(e => e.metadata.stageId === filters.stageId);
    if (filters.since) filtered = filtered.filter(e => e.metadata.timestamp >= filters.since);
    if (filters.until) filtered = filtered.filter(e => e.metadata.timestamp <= filters.until);
    return filtered;
  }

  replayTrace(traceId, options = {}) {
    const events = this.getEventLog({ traceId });
    console.log(`[EventBus] 🔁 回放 trace=${traceId} | ${events.length}个事件`);
    for (const event of events) {
      if (options.skipTypes && options.skipTypes.includes(event.type)) continue;
      this.emit(event.type, event);
    }
    return events.length;
  }

  replayForStage(stageId, eventTypes = []) {
    const relevant = this.eventLog.filter(e =>
      eventTypes.includes(e.type) && e.metadata.sourceStage !== stageId
    );
    console.log(`[EventBus] 🔁 回放 Stage=${stageId} | ${relevant.length}个相关事件`);
    for (const event of relevant) {
      this.emit(event.type, event);
    }
    return relevant.length;
  }

  // ============================================================
  // Mutations 追踪
  // ============================================================

  recordMutation(traceId, mutation) {
    return this.mutationTracker.record(traceId, mutation);
  }

  getMutations(traceId, filters) {
    return this.mutationTracker.getHistory(traceId, filters);
  }

  detectMutationAnomalies(traceId, expectedStagesPerField) {
    return this.mutationTracker.detectAnomalies(traceId, expectedStagesPerField);
  }

  // ============================================================
  // 统计与报告
  // ============================================================

  getSubscriberStats() {
    return { ...this.subscriberStats };
  }

  getErrorLog(limit = 50) {
    return this.errorLog.slice(-limit);
  }

  getReport() {
    return {
      name: this.name,
      enabled: this.enabled,
      totalEvents: this.eventLog.length,
      totalErrors: this.errorLog.length,
      subscriberStats: this.getSubscriberStats(),
      mutationCount: Array.from(this.mutationTracker.mutations.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }

  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this._deepClone(item));
    const cloned = {};
    for (const key of Object.keys(obj)) {
      cloned[key] = this._deepClone(obj[key]);
    }
    return cloned;
  }

  clear() {
    this.eventLog = [];
    this.errorLog = [];
    this.mutationTracker = new MutationTracker();
    console.log(`[EventBus:${this.name}] 已清空所有日志`);
  }

  /**
   * 自检方法
   */
  validate() {
    const checks = [
      { name: 'EventEmitter正常', pass: this instanceof EventEmitter },
      { name: '事件定义完整', pass: Object.keys(COMMERCIAL_EVENT_DEFINITIONS).length > 0 },
      { name: 'MutationTracker已初始化', pass: this.mutationTracker instanceof MutationTracker },
      { name: '日志上限有效', pass: this.maxLogSize > 0 },
      { name: '商业广告特有事件存在', pass: 'commercial.product.analyzed' in COMMERCIAL_EVENT_DEFINITIONS }
    ];

    const failed = checks.filter(c => !c.pass);
    return {
      healthy: failed.length === 0,
      component: 'CommercialEventBus',
      checks,
      failedChecks: failed.map(c => c.name),
      eventTypes: Object.keys(COMMERCIAL_EVENT_DEFINITIONS).length
    };
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  CommercialEventBus,
  MutationTracker,
  COMMERCIAL_EVENT_DEFINITIONS,

  getEventBus: (options) => new CommercialEventBus(options)
};

// ============================================================
// 自检测试
// ============================================================

if (require.main === module) {
  async function test() {
    console.log('=== Commercial Event Bus 自检 ===\n');

    const bus = new CommercialEventBus({ name: 'test-bus', debug: true });

    // 测试1：自检
    const v = bus.validate();
    console.log('自检结果:', v.healthy ? '通过' : '不通过');
    console.log('事件类型数:', v.eventTypes);

    // 测试2：发布/订阅
    console.log('\n--- 测试2：发布/订阅 ---');
    let received = null;
    const unsub = bus.subscribe('commercial.product.analyzed', (payload) => {
      received = payload;
    });
    bus.publish('commercial.product.analyzed', {
      productName: 'TestProduct',
      sellingPoints: ['SP1'],
      targetAudience: 'all'
    }, { traceId: 'test-001' });
    await new Promise(r => setTimeout(r, 50));
    console.log('接收成功:', received?.productName === 'TestProduct');
    unsub();

    // 测试3：Mutations追踪
    console.log('\n--- 测试3：Mutations追踪 ---');
    bus.recordMutation('trace-001', {
      stageId: 'STAGE-CM-3',
      shotId: 'S01',
      field: 'visualPrompt',
      previousValue: 'old',
      newValue: 'new with more details'
    });
    const mutations = bus.getMutations('trace-001');
    console.log('Mutations记录:', mutations.length);
    console.log('SizeDelta:', mutations[0].sizeDelta);

    // 测试4：事件回放
    console.log('\n--- 测试4：事件回放 ---');
    bus.publish('stage.completed', { stageId: 'STAGE-CM-1', traceId: 'replay-test', status: 'success' }, { traceId: 'replay-test' });
    bus.publish('stage.completed', { stageId: 'STAGE-CM-2', traceId: 'replay-test', status: 'success' }, { traceId: 'replay-test' });
    const replayCount = bus.replayTrace('replay-test');
    console.log('回放事件数:', replayCount);

    // 测试5：统计报告
    console.log('\n--- 测试5：统计报告 ---');
    const report = bus.getReport();
    console.log('总事件:', report.totalEvents);
    console.log('总错误:', report.totalErrors);
    console.log('Mutations:', report.mutationCount);

    console.log('\n=== 自检完成 ===');
  }

  test().catch(console.error);
}
