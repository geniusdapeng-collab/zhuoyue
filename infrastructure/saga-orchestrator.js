/**
 * Commercial Saga Orchestrator v1.0 — 商业广告片专用Saga编排器
 * zhuoyue/infrastructure/saga-orchestrator.js
 *
 * 基于超短裙的Saga Orchestrator移植，适配商业广告片9个Stage。
 * 职责：
 * - 阶段原子性执行
 * - 补偿事务（下游失败时回滚上游）
 * - 自动重试（指数退避）
 * - 降级回退（skip / default_value）
 * - 事件集成
 *
 * @version v1.0
 * @author 协同进化引擎
 */

'use strict';

// ============================================================
// 商业广告片Stage定义
// ============================================================

const COMMERCIAL_STAGE_DEFINITIONS = {
  'STAGE-CM-1': {
    id: 'STAGE-CM-1',
    name: '商业需求解析',
    phase: 'pre_production',
    blocking: true,
    required: true,
    timeoutMs: 30000,
    retryPolicy: { maxAttempts: 2, backoffMs: 2000 },
    compensate: async (result, context) => {
      if (context.commercialRequirements) delete context.commercialRequirements;
      console.log('[Saga:Compensate] STAGE-CM-1 已清理商业需求数据');
    }
  },
  'STAGE-CM-2': {
    id: 'STAGE-CM-2',
    name: '广告结构生成',
    phase: 'pre_production',
    blocking: true,
    required: true,
    timeoutMs: 20000,
    retryPolicy: { maxAttempts: 2, backoffMs: 1000 },
    compensate: async (result, context) => {
      if (context.adStructure) delete context.adStructure;
      console.log('[Saga:Compensate] STAGE-CM-2 已清理广告结构数据');
    }
  },
  'STAGE-CM-3': {
    id: 'STAGE-CM-3',
    name: '剧本生成',
    phase: 'pre_production',
    blocking: true,
    required: true,
    timeoutMs: 120000,
    retryPolicy: { maxAttempts: 2, backoffMs: 5000 },
    compensate: async (result, context) => {
      if (context.script) delete context.script;
      if (context.scenes) delete context.scenes;
      console.log('[Saga:Compensate] STAGE-CM-3 已清理剧本数据');
    }
  },
  'STAGE-CM-4': {
    id: 'STAGE-CM-4',
    name: 'Prompt Guardian修复',
    phase: 'pre_production',
    blocking: true,
    required: true,
    timeoutMs: 30000,
    retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
    fallback: { strategy: 'skip' },
    compensate: null
  },
  'STAGE-CM-5': {
    id: 'STAGE-CM-5',
    name: '故事板生成',
    phase: 'pre_production',
    blocking: true,
    required: true,
    timeoutMs: 120000,
    retryPolicy: { maxAttempts: 2, backoffMs: 5000 },
    compensate: async (result, context) => {
      if (context.storyboard) delete context.storyboard;
      if (context.shots) delete context.shots;
      console.log('[Saga:Compensate] STAGE-CM-5 已清理故事板数据');
    }
  },
  'STAGE-CM-6': {
    id: 'STAGE-CM-6',
    name: '连续性检查',
    phase: 'pre_production',
    blocking: true,
    required: true,
    timeoutMs: 20000,
    retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
    fallback: { strategy: 'skip' },
    compensate: null
  },
  'STAGE-CM-7': {
    id: 'STAGE-CM-7',
    name: 'Render Pipeline Guard检查',
    phase: 'pre_production',
    blocking: true,
    required: true,
    timeoutMs: 30000,
    retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
    fallback: { strategy: 'skip' },
    compensate: null
  },
  'STAGE-CM-8': {
    id: 'STAGE-CM-8',
    name: '渲染执行',
    phase: 'production',
    blocking: true,
    required: true,
    timeoutMs: 600000,
    retryPolicy: { maxAttempts: 1, backoffMs: 10000 },
    compensate: async (result, context) => {
      if (context.renderOutput) {
        console.log('[Saga:Compensate] STAGE-CM-8 清理渲染输出');
        delete context.renderOutput;
      }
    }
  },
  'STAGE-CM-9': {
    id: 'STAGE-CM-9',
    name: '后期制作',
    phase: 'post_production',
    blocking: true,
    required: true,
    timeoutMs: 300000,
    retryPolicy: { maxAttempts: 1, backoffMs: 5000 },
    compensate: null
  }
};

// ============================================================
// Saga Stage 执行器
// ============================================================

class SagaStage {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.phase = config.phase || 'unknown';
    this.blocking = config.blocking !== false;
    this.required = config.required !== false;
    this.timeoutMs = config.timeoutMs || 120000;
    this.retryPolicy = config.retryPolicy || { maxAttempts: 1, backoffMs: 1000 };
    this.fallback = config.fallback || { strategy: 'skip' };
    this.compensate = config.compensate || null;
    this.executeFn = null;
    // 保留自定义属性（如 _skillRef）
    Object.keys(config).forEach(key => {
      if (!(key in this)) {
        this[key] = config[key];
      }
    });
  }

  setExecuteFn(fn) {
    this.executeFn = fn;
  }

  async run(input, context) {
    const startMs = Date.now();
    let attempts = 0;
    const traceId = context.traceId || `saga_${Date.now()}`;

    console.log(`[SagaStage:${this.id}] ▶️ 开始执行 | ${this.name}`);

    while (attempts < this.retryPolicy.maxAttempts) {
      attempts++;
      try {
        const result = await this._executeWithTimeout(input, context);
        const durationMs = Date.now() - startMs;

        console.log(`[SagaStage:${this.id}] ✅ 完成 | ${durationMs}ms | 尝试${attempts}/${this.retryPolicy.maxAttempts}`);

        return {
          status: 'success',
          output: result,
          durationMs,
          attempts,
          stageId: this.id
        };
      } catch (error) {
        console.error(`[SagaStage:${this.id}] ❌ 尝试${attempts}失败: ${error.message}`);

        if (attempts < this.retryPolicy.maxAttempts) {
          const backoffMs = this.retryPolicy.backoffMs * Math.pow(2, attempts - 1);
          console.log(`[SagaStage:${this.id}] ⏳ ${backoffMs}ms后重试...`);
          await this._sleep(backoffMs);
          continue;
        }

        return this._handleFailure(error, input, context, startMs);
      }
    }
  }

  async _executeWithTimeout(input, context) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Stage ${this.id} 超时 ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      try {
        if (!this.executeFn) {
          throw new Error(`Stage ${this.id} 未设置执行函数`);
        }
        const result = await this.executeFn(input, context);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  _handleFailure(error, input, context, startMs) {
    const durationMs = Date.now() - startMs;
    const failureResult = {
      status: 'failed',
      error: {
        type: error.name,
        message: error.message,
        recoverable: this._isRecoverableError(error)
      },
      durationMs,
      stageId: this.id
    };

    switch (this.fallback.strategy) {
      case 'skip':
        if (!this.blocking) {
          console.warn(`[SagaStage:${this.id}] ⚠️ 非阻塞Stage失败，跳过 | ${error.message}`);
          failureResult.status = 'skipped';
          failureResult.output = input;
        } else if (this.fallback.strategy === 'skip') {
          // 阻塞但fallback是skip，降级为跳过（带警告）
          console.warn(`[SagaStage:${this.id}] ⚠️ Stage失败但配置为skip，降级处理 | ${error.message}`);
          failureResult.status = 'skipped';
          failureResult.output = input;
        } else {
          console.error(`[SagaStage:${this.id}] 💥 阻塞Stage失败，阻断链路 | ${error.message}`);
        }
        break;

      case 'mock':
        console.warn(`[SagaStage:${this.id}] ⚠️ 使用Mock降级`);
        failureResult.status = 'partial';
        failureResult.output = this._generateMockOutput(input);
        break;

      case 'default_value':
        console.warn(`[SagaStage:${this.id}] ⚠️ 使用默认值降级`);
        failureResult.status = 'partial';
        failureResult.output = { ...input, ...this.fallback.defaultValue };
        break;

      default:
        if (!this.blocking) {
          failureResult.status = 'skipped';
        }
    }

    return failureResult;
  }

  _isRecoverableError(error) {
    const recoverablePatterns = [
      /timeout/i, /ETIMEDOUT/i, /ECONNRESET/i,
      /rate limit/i, /429/i, /temporary/i,
      /503/i, /502/i, /504/i
    ];
    return recoverablePatterns.some(p => p.test(error.message));
  }

  _generateMockOutput(input) {
    return {
      ...input,
      _mockGenerated: true,
      _mockStage: this.id,
      _mockTimestamp: Date.now()
    };
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
// Saga 编排器
// ============================================================

class CommercialSagaOrchestrator {
  constructor(options = {}) {
    this.stages = new Map();
    this.compensationLog = [];
    this.traceId = null;
    this.eventBus = options.eventBus || null;
    this.options = {
      enableCompensation: options.enableCompensation !== false,
      publishEvents: options.publishEvents !== false,
      ...options
    };
  }

  /**
   * 注册Stage
   */
  registerStage(stageConfig, executeFn) {
    const stage = new SagaStage(stageConfig);
    if (executeFn) {
      stage.setExecuteFn(executeFn);
    }
    this.stages.set(stageConfig.id, stage);
    return this;
  }

  /**
   * 从定义批量注册
   */
  registerFromDefinitions(definitions, executeFns = {}) {
    for (const [id, config] of Object.entries(definitions)) {
      const stage = new SagaStage(config);
      if (executeFns[id]) {
        stage.setExecuteFn(executeFns[id]);
      }
      this.stages.set(id, stage);
    }
    return this;
  }

  /**
   * 执行完整链路
   */
  async execute(input, options = {}) {
    this.traceId = options.traceId || `commercial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context = { ...input, traceId: this.traceId, eventBus: this.eventBus };
    const executedStages = [];
    const results = {};
    const stageOrder = options.stageOrder || Array.from(this.stages.keys());

    console.log(`\n[CommercialSaga] 🚀 开始执行商业广告链路 | traceId=${this.traceId}`);
    console.log(`[CommercialSaga] 📋 共${stageOrder.length}个Stage | 补偿:${this.options.enableCompensation ? '启用' : '禁用'}`);

    this._publishEvent('pipeline.started', {
      traceId: this.traceId,
      stageCount: stageOrder.length,
      type: 'commercial',
      inputKeys: Object.keys(input)
    });

    for (const stageId of stageOrder) {
      const stage = this.stages.get(stageId);
      if (!stage) {
        console.warn(`[CommercialSaga] ⚠️ Stage ${stageId} 未注册，跳过`);
        continue;
      }

      console.log(`\n[CommercialSaga] ▶️ 执行 ${stageId} | ${stage.name} | ${stage.blocking ? '阻塞' : '非阻塞'}`);

      const result = await stage.run(context, context);
      results[stageId] = result;

      if (result.status === 'success' || result.status === 'partial') {
        // P3: 使用上下文累积策略合并输出
        if (result.output && typeof result.output === 'object') {
          const strategy = options.contextStrategy || null;
          if (strategy && typeof strategy.accumulate === 'function') {
            Object.assign(context, strategy.accumulate(context, result.output, stageId));
          } else {
            Object.assign(context, result.output);
          }
        }
        executedStages.push({ stageId, compensated: false, status: result.status });

        this._publishEvent('stage.completed', {
          stageId,
          status: result.status,
          durationMs: result.durationMs,
          traceId: this.traceId
        });

      } else if (result.status === 'skipped') {
        console.log(`[CommercialSaga] ⏭️ ${stageId} 已跳过`);
        executedStages.push({ stageId, compensated: false, skipped: true, status: 'skipped' });

        this._publishEvent('stage.skipped', {
          stageId,
          traceId: this.traceId,
          reason: 'fallback_skip'
        });

      } else {
        console.error(`[CommercialSaga] 💥 ${stageId} 失败且阻塞！触发补偿...`);

        if (this.options.enableCompensation) {
          await this._compensate(executedStages, results, context);
        }

        this._publishEvent('pipeline.failed', {
          traceId: this.traceId,
          failedAt: stageId,
          error: result.error
        });

        throw new Error(`Pipeline在${stageId}失败: ${result.error.message}`);
      }
    }

    console.log(`\n[CommercialSaga] ✅ 链路完成 | traceId=${this.traceId} | 成功Stage:${executedStages.filter(s => s.status === 'success').length}/${stageOrder.length}`);

    this._publishEvent('pipeline.completed', {
      traceId: this.traceId,
      stageCount: stageOrder.length,
      completedCount: executedStages.filter(s => s.status === 'success').length,
      skippedCount: executedStages.filter(s => s.status === 'skipped').length,
      type: 'commercial'
    });

    return {
      traceId: this.traceId,
      results,
      context,
      executedStages,
      success: true
    };
  }

  /**
   * 执行补偿事务
   */
  async _compensate(executedStages, results, context) {
    console.log('[CommercialSaga] 🔙 开始补偿事务...');

    for (let i = executedStages.length - 1; i >= 0; i--) {
      const { stageId } = executedStages[i];
      const stage = this.stages.get(stageId);

      if (stage && stage.compensate) {
        try {
          console.log(`[CommercialSaga] 🔙 补偿 ${stageId}...`);
          await stage.compensate(results[stageId], context);
          executedStages[i].compensated = true;

          this._publishEvent('stage.compensated', {
            stageId,
            traceId: this.traceId
          });
        } catch (compError) {
          console.error(`[CommercialSaga] ❌ 补偿失败 ${stageId}: ${compError.message}`);
          this.compensationLog.push({
            stageId,
            error: compError.message,
            timestamp: Date.now(),
            traceId: this.traceId
          });
        }
      }
    }

    console.log(`[CommercialSaga] 🔙 补偿完成 | 已补偿:${executedStages.filter(s => s.compensated).length}/${executedStages.length}`);
  }

  _publishEvent(eventType, payload) {
    if (this.eventBus && this.options.publishEvents) {
      this.eventBus.publish(eventType, payload, { orchestrator: 'commercial-saga', traceId: this.traceId });
    }
  }

  /**
   * 获取执行报告
   */
  getExecutionReport() {
    return {
      traceId: this.traceId,
      stages: Array.from(this.stages.values()).map(s => ({
        id: s.id,
        name: s.name,
        blocking: s.blocking,
        required: s.required
      })),
      compensationLog: this.compensationLog
    };
  }

  /**
   * 自检方法
   */
  validate() {
    const checks = [
      { name: '至少注册了1个Stage', pass: this.stages.size > 0 },
      { name: '所有Stage有executeFn', pass: Array.from(this.stages.values()).every(s => s.executeFn !== null) },
      { name: 'Stage ID唯一', pass: this.stages.size === new Set(Array.from(this.stages.keys())).size }
    ];

    const failed = checks.filter(c => !c.pass);
    const healthy = failed.length === 0;

    return {
      healthy,
      component: 'CommercialSagaOrchestrator',
      checks,
      failedChecks: failed.map(c => c.name),
      stageCount: this.stages.size
    };
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  CommercialSagaOrchestrator,
  SagaStage,
  COMMERCIAL_STAGE_DEFINITIONS,

  createCommercialOrchestrator: (executeFns = {}, options = {}) => {
    const orchestrator = new CommercialSagaOrchestrator(options);
    orchestrator.registerFromDefinitions(COMMERCIAL_STAGE_DEFINITIONS, executeFns);
    return orchestrator;
  }
};

// ============================================================
// 自检测试
// ============================================================

if (require.main === module) {
  async function test() {
    console.log('=== Commercial Saga Orchestrator 自检 ===\n');

    const orch = new CommercialSagaOrchestrator();

    // 自检：未注册Stage时应不健康
    let v = orch.validate();
    console.log('空注册表自检:', v.healthy ? '通过' : '不通过（预期）', '| 失败:', v.failedChecks);

    // 注册测试Stage
    orch.registerStage(COMMERCIAL_STAGE_DEFINITIONS['STAGE-CM-1'], async () => ({ product: 'test' }));
    orch.registerStage(COMMERCIAL_STAGE_DEFINITIONS['STAGE-CM-2'], async () => ({ structure: {} }));

    v = orch.validate();
    console.log('注册后自检:', v.healthy ? '通过' : '不通过');

    // 完整执行测试
    console.log('\n--- 完整执行测试 ---');
    try {
      const result = await orch.execute({ brand: 'TestBrand' }, {
        stageOrder: ['STAGE-CM-1', 'STAGE-CM-2']
      });
      console.log('✅ Pipeline成功:', result.success);
      console.log('上下文keys:', Object.keys(result.context));
    } catch (e) {
      console.log('❌ 意外失败:', e.message);
    }

    // 失败+补偿测试
    console.log('\n--- 失败+补偿测试 ---');
    const orch2 = new CommercialSagaOrchestrator({ enableCompensation: true });
    let compensated = false;
    orch2.registerStage({
      ...COMMERCIAL_STAGE_DEFINITIONS['STAGE-CM-3'],
      compensate: async () => { compensated = true; console.log('✅ 补偿已执行！'); }
    }, async () => ({ script: {} }));
    orch2.registerStage({
      id: 'STAGE-FAIL', name: '故意失败', phase: 'production',
      blocking: true, required: true, timeoutMs: 1000,
      retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
      fallback: { strategy: 'skip' }
    }, async () => { throw new Error('模拟失败'); });

    try {
      await orch2.execute({}, { stageOrder: ['STAGE-CM-3', 'STAGE-FAIL'] });
    } catch (e) {
      console.log('预期失败:', e.message);
      console.log('补偿执行:', compensated ? '是' : '否');
    }

    console.log('\n=== 自检完成 ===');
  }

  test().catch(console.error);
}
