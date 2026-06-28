/**
 * Infrastructure Index — 基础设施统一出口
 * zhuoyue/infrastructure/index.js
 *
 * 提供所有基础设施模块的统一入口，简化引用。
 * P6 更新：集成 MetricsCollector，支持生产环境指标暴露。
 *
 * @version v1.1
 */

'use strict';

const { CommercialEventBus, COMMERCIAL_EVENT_DEFINITIONS } = require('./event-bus');
const { CommercialSagaOrchestrator, SagaStage, COMMERCIAL_STAGE_DEFINITIONS, createCommercialOrchestrator } = require('./saga-orchestrator');
const { LLMGateway, CircuitBreaker, KimiProviderAdapter, OpenAIProviderAdapter, JSONSafeParser, LLMEngineWrapper, CB_STATE, getLLMGateway, callLLM } = require('./llm-gateway');
const { SkillOrchestratorAdapter, SkillStageFactory, IOContractValidator } = require('./skill-orchestrator-adapter');
const { ContextAccumulationStrategy, CommercialContextPresets } = require('./context-accumulation-strategy');

// P6: MetricsCollector（可选加载，不破坏现有引用）
let MetricsCollector;
try {
  const metrics = require('../deploy/metrics-collector');
  MetricsCollector = metrics.MetricsCollector;
} catch (e) {
  MetricsCollector = null;
}

module.exports = {
  // Event Bus
  CommercialEventBus,
  COMMERCIAL_EVENT_DEFINITIONS,

  // Saga Orchestrator
  CommercialSagaOrchestrator,
  SagaStage,
  COMMERCIAL_STAGE_DEFINITIONS,
  createCommercialOrchestrator,

  // LLM Gateway
  LLMGateway,
  CircuitBreaker,
  KimiProviderAdapter,
  OpenAIProviderAdapter,
  JSONSafeParser,
  LLMEngineWrapper,
  CB_STATE,
  getLLMGateway,
  callLLM,

  // P2/P3: Skill Orchestration
  SkillOrchestratorAdapter,
  SkillStageFactory,
  IOContractValidator,

  // P3: Context Accumulation
  ContextAccumulationStrategy,
  CommercialContextPresets,

  // P6: Metrics (nullable if deploy/ not available)
  MetricsCollector
};

// ---- P6: 如果直接运行此文件，启动完整服务 ----
if (require.main === module) {
  const path = require('path');

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Commercial Ad Skill Orchestrator v1.0                     ║');
  console.log('║  生产环境启动中...                                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // 启动指标服务
  if (MetricsCollector && process.env.ENABLE_METRICS !== 'false') {
    const collector = new MetricsCollector();
    collector.startHttpServer(process.env.EVENT_BUS_PORT || 3000);
  } else {
    console.log('[Startup] 指标服务未启用');
  }

  // 加载 Skill 系统
  const { SkillLoader } = require(path.join(__dirname, '..', 'skills', 'skill-loader'));
  const { SkillRegistry } = require(path.join(__dirname, '..', 'skills', 'skill-registry'));

  const skillLoader = new SkillLoader({
    skillDirs: [path.join(__dirname, '..', 'skills')]
  });

  skillLoader.scan();
  const loaded = skillLoader.load();

  const registry = new SkillRegistry();
  loaded.forEach(s => registry.register(s));

  console.log(`[Startup] ✅ Skill 系统就绪 | ${loaded.length} 个 Skill 已加载`);
  console.log(`[Startup] 按 Ctrl+C 停止服务`);
}
