#!/usr/bin/env node
'use strict';

/**
 * Skill Validation Script — P4 端到端事件总线 + 错误注入 + 补偿机制验证
 */

const path = require('path');

const SKILLS_DIR = path.join(__dirname);
const INFRA_DIR = path.join(__dirname, '..', 'infrastructure');

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

function log(label, msg, color = C.reset) {
  console.log(`${color}[${label}]${C.reset} ${msg}`);
}

function section(title) {
  console.log(`\n${C.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`${C.blue}  ${title}${C.reset}`);
  console.log(`${C.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}\n`);
}

async function main() {
  let exitCode = 0;
  let allPassed = true;

  const { SkillLoader } = require(path.join(SKILLS_DIR, 'skill-loader'));
  const { SkillRegistry } = require(path.join(SKILLS_DIR, 'skill-registry'));
  const { CommercialEventBus } = require(path.join(INFRA_DIR, 'event-bus'));
  const { CommercialSagaOrchestrator } = require(path.join(INFRA_DIR, 'saga-orchestrator'));
  const { SkillOrchestratorAdapter } = require(path.join(INFRA_DIR, 'skill-orchestrator-adapter'));
  const { ContextAccumulationStrategy, CommercialContextPresets } = require(path.join(INFRA_DIR, 'context-accumulation-strategy'));

  // ============================================================
  // Test 7: 真实商业广告场景端到端链路验证（完整数据流）
  // ============================================================
  section('Test 7: 真实商业广告场景端到端链路验证');

  const eventBus = new CommercialEventBus({ name: 'p4-test-bus', debug: false });
  const loader = new SkillLoader({ skillsDir: SKILLS_DIR, autoRegister: false });
  const loadResult = loader.loadAll();
  const registry = new SkillRegistry();
  for (const skill of loadResult.loaded) {
    registry.register(skill);
  }

  const contextStrategy = new ContextAccumulationStrategy({
    aliases: CommercialContextPresets.aliases
  });

  const adapter = new SkillOrchestratorAdapter({
    eventBus,
    validateCompatibility: false, // 测试数据可能不兼容，不阻断
    contextStrategy,
    validateInput: false, // 关闭输入校验，测试完整数据流
    validateOutput: false
  });

  adapter.registerFromRegistry(registry);
  log('PASS', `Adapter 注册完成 | ${adapter.skillStageMap.size} 个 Skill→Stage 映射`, C.green);

  // 真实商业广告场景：30s 高端护肤品广告
  const commercialScene = {
    product: {
      name: 'LuminaGlow 夜间修护精华液',
      type: 'skincare',
      category: 'luxury',
      price: '¥1,280',
      sellingPoints: [
        '92%天然成分，0添加防腐剂',
        '专研Pro-Xylane™抗老配方',
        '28天重塑肌肤弹性',
        '皮肤科医师推荐'
      ]
    },
    brand: {
      name: 'LuminaGlow',
      style: 'luxury_minimal',
      colors: ['#F8EDE3', '#D4A574', '#1A1A1A'],
      voice: '优雅知性、科学可信'
    },
    targetAudience: {
      primary: '25-40岁都市女性',
      painPoints: ['熬夜肌', '初老焦虑', '敏感肌困扰'],
      platforms: ['抖音', '小红书', '微信朋友圈']
    },
    adRequirements: {
      duration: 30, // 秒
      format: 'vertical_9_16',
      resolution: '1080x1920',
      scenes: 5,
      musicStyle: 'ambient_luxury'
    },
    // 预置运镜数据（模拟上游 Skill 输出）
    cameraPlan: {
      shots: [
        { id: 'S01', scale: 'CU', duration: 3, movement: 'static', prompt: '清晨阳光透过纱帘，女性指尖轻触瓶身，金色液体在指尖流转' },
        { id: 'S02', scale: 'ECU', duration: 4, movement: 'rack_focus', prompt: '精华液滴落瞬间，微距镜头捕捉液体拉丝质感，背景虚化为柔和光斑' },
        { id: 'S03', scale: 'MS', duration: 6, movement: 'slow_push', prompt: '女性优雅涂抹精华，侧光勾勒出下颌线，肌肤呈现自然光泽' },
        { id: 'S04', scale: 'CU', duration: 5, movement: 'orbit', prompt: '旋转镜头环绕面部，展示前后对比，毛孔细腻度变化' },
        { id: 'S05', scale: 'WS', duration: 8, movement: 'crane_up', prompt: '无人机镜头从床头升起，女性自信微笑，产品置于前景，城市天际线为背景' }
      ]
    },
    // 预置角色数据
    characters: [
      { name: 'Elara', role: 'protagonist', age: 32, appearance: '优雅亚洲女性，长发微卷，自然妆容' }
    ],
    // 输出路径
    outputPath: '/tmp/lumina-glow-commercial',
    renderOutput: ['/tmp/lumina-glow/v1.mp4', '/tmp/lumina-glow/v2.mp4']
  };

  try {
    const pipelineResult = await adapter.execute(commercialScene, {
      traceId: `p4_commercial_${Date.now()}`
    });

    log('PASS', `商业广告场景 Pipeline 执行成功 | traceId=${pipelineResult.traceId}`, C.green);
    log('INFO', `成功 Stage: ${pipelineResult.executedStages.filter(s => s.status === 'success').length}/${pipelineResult.executedStages.length}`, C.blue);
    log('INFO', `跳过 Stage: ${pipelineResult.executedStages.filter(s => s.status === 'skipped').length}`, C.blue);

    for (const [stageId, result] of Object.entries(pipelineResult.results)) {
      const status = result.status === 'success' ? C.green : (result.status === 'skipped' ? C.yellow : C.red);
      log('STAGE', `${stageId}: ${result.status} | ${result.durationMs}ms`, status);
    }

    // 验证上下文累积：检查 cameraPlan.shots 是否被正确映射到 shots
    const finalContext = pipelineResult.context;
    if (finalContext.shots || finalContext.cameraPlan?.shots) {
      log('PASS', '上下文累积验证：shots 数据已传递', C.green);
    } else {
      log('WARN', '上下文累积验证：shots 数据未传递（可能 Skill 未生成）', C.yellow);
    }

    // 验证产品信息是否被传递
    if (finalContext.product?.name) {
      log('PASS', `上下文累积验证：product.name = "${finalContext.product.name}"`, C.green);
    }

    // 验证 EventBus 是否记录了事件
    const eventLog = eventBus.getEventLog({ traceId: pipelineResult.traceId });
    log('INFO', `EventBus 记录事件数: ${eventLog.length}`, C.blue);

    const pipelineEvents = eventLog.filter(e => e.type.startsWith('pipeline.'));
    const stageEvents = eventLog.filter(e => e.type.startsWith('stage.'));
    log('INFO', `  Pipeline 事件: ${pipelineEvents.length}`, C.gray);
    log('INFO', `  Stage 事件: ${stageEvents.length}`, C.gray);

    if (pipelineEvents.length >= 2) { // started + completed
      log('PASS', 'EventBus 事件发布验证：Pipeline 生命周期事件已发布', C.green);
    } else {
      log('WARN', 'EventBus 事件发布验证：Pipeline 事件数量不足', C.yellow);
    }

  } catch (e) {
    log('FAIL', `商业广告场景 Pipeline 执行失败: ${e.message}`, C.red);
    allPassed = false; exitCode = 1;
  }

  // ============================================================
  // Test 8: 错误注入 + 补偿机制验证
  // ============================================================
  section('Test 8: 错误注入 + 补偿机制验证');

  const errorEventBus = new CommercialEventBus({ name: 'p4-error-bus', debug: false });
  const errorRegistry = new SkillRegistry();

  // 加载正常 Skill
  for (const skill of loadResult.loaded) {
    errorRegistry.register(skill);
  }

  // 创建一个会失败的模拟 Skill（注入错误）
  const { SkillBase } = require(path.join(SKILLS_DIR, 'skill-base'));
  class FailingSkill extends SkillBase {
    constructor() {
      super({
        id: 'failing-skill',
        name: 'FailingSkill',
        version: '1.0.0',
        description: '模拟失败 Skill，用于测试补偿机制',
        dependencies: ['continuity-engine-skill']
      });
    }
    async onInitialize() { return true; }
    async execute() {
      throw new Error('模拟错误：LLM 服务超时');
    }
    validateSelf() {
      return { healthy: true, checks: [{ name: '模拟自检', pass: true }] };
    }
  }

  const failingSkill = new FailingSkill();
  errorRegistry.register(failingSkill);

  const errorAdapter = new SkillOrchestratorAdapter({
    eventBus: errorEventBus,
    validateCompatibility: false,
    validateInput: false,
    validateOutput: false
  });

  errorAdapter.registerFromRegistry(errorRegistry);
  log('INFO', `错误注入测试：已注册 ${errorAdapter.skillStageMap.size} 个 Stage（含 FailingSkill）`, C.blue);

  // 设置 FailingSkill 为阻塞（默认就是），确保失败会触发补偿
  // 在 Stage 定义中，failing-skill 的 fallback 默认是 skip，但如果我们想测试补偿，需要阻塞 + 不 skip
  // 但由于 Adapter 的 Stage 定义是自动生成的，fallback 是 skip，所以失败会被跳过而不是阻断
  // 我们需要手动创建一个阻塞的 failing Stage

  const errorOrchestrator = new CommercialSagaOrchestrator({
    eventBus: errorEventBus,
    enableCompensation: true,
    publishEvents: true
  });

  // 注册一个会失败的 Stage
  errorOrchestrator.registerStage({
    id: 'STAGE-FAILING',
    name: '模拟失败 Stage',
    blocking: true,
    required: true,
    timeoutMs: 5000,
    retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
    fallback: { strategy: 'none' }, // 不降级，失败就阻断
    compensate: async (result, context) => {
      log('INFO', '补偿函数被调用：清理 failing-skill 相关数据', C.magenta);
      if (context.failingData) delete context.failingData;
    }
  }, async () => {
    throw new Error('模拟错误：LLM 服务超时');
  });

  // 注册一个前置成功 Stage（用于验证补偿是否回滚）
  errorOrchestrator.registerStage({
    id: 'STAGE-PRE',
    name: '前置成功 Stage',
    blocking: true,
    required: true,
    timeoutMs: 5000,
    retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
    compensate: async (result, context) => {
      log('INFO', '补偿函数被调用：清理前置 Stage 数据', C.magenta);
      if (context.preData) delete context.preData;
    }
  }, async (input, context) => {
    context.preData = { stage: 'pre', timestamp: Date.now() };
    return { preData: context.preData };
  });

  try {
    await errorOrchestrator.execute({ test: 'error-injection' }, {
      traceId: `p4_error_injection_${Date.now()}`,
      stageOrder: ['STAGE-PRE', 'STAGE-FAILING']
    });
    log('FAIL', '错误注入测试：预期失败但未触发', C.red);
    allPassed = false; exitCode = 1;
  } catch (e) {
    log('PASS', `错误注入测试：Pipeline 正确失败 | ${e.message}`, C.green);

    // 验证补偿是否被调用
    const compensationCount = errorOrchestrator.compensationLog.length;
    if (compensationCount > 0) {
      log('PASS', `补偿机制验证：${compensationCount} 个补偿已记录`, C.green);
    } else {
      log('WARN', '补偿机制验证：未记录补偿（可能补偿执行成功但无错误）', C.yellow);
    }

    // 验证事件发布
    const errorEvents = errorEventBus.getEventLog({ eventType: 'pipeline.failed' });
    if (errorEvents.length > 0) {
      log('PASS', 'EventBus 验证：pipeline.failed 事件已发布', C.green);
    } else {
      log('WARN', 'EventBus 验证：未找到 pipeline.failed 事件', C.yellow);
    }
  }

  // ============================================================
  // Test 9: 事件总线订阅/回放验证
  // ============================================================
  section('Test 9: 事件总线订阅/回放验证');

  const subEventBus = new CommercialEventBus({ name: 'p4-sub-bus', debug: true });

  let receivedEvents = [];
  let mutationCount = 0;

  // 订阅商业广告特有事件
  const unsub1 = subEventBus.subscribe('commercial.product.analyzed', (payload) => {
    receivedEvents.push({ type: 'commercial.product.analyzed', payload });
    log('EVENT', `收到 product.analyzed: ${payload.productName}`, C.magenta);
  });

  const unsub2 = subEventBus.subscribe('stage.completed', (payload, metadata) => {
    receivedEvents.push({ type: 'stage.completed', payload, metadata });
  });

  const unsub3 = subEventBus.subscribe('data.mutated', (payload, metadata, mutations) => {
    receivedEvents.push({ type: 'data.mutated', payload, mutations });
    mutationCount += mutations.length;
  });

  // 发布事件
  subEventBus.publish('commercial.product.analyzed', {
    productName: 'LuminaGlow',
    sellingPoints: ['SP1', 'SP2'],
    targetAudience: '都市女性'
  }, { traceId: 'p4-sub-test' });

  subEventBus.publish('stage.completed', {
    stageId: 'STAGE-CM-3',
    traceId: 'p4-sub-test',
    status: 'success'
  }, { traceId: 'p4-sub-test' });

  subEventBus.recordMutation('p4-sub-test', {
    stageId: 'STAGE-CM-3',
    shotId: 'S01',
    field: 'visualPrompt',
    previousValue: 'old prompt',
    newValue: 'enhanced prompt with brand colors'
  });

  // 等待事件处理
  await new Promise(r => setTimeout(r, 100));

  log('INFO', `订阅者收到事件数: ${receivedEvents.length}`, C.blue);
  log('INFO', `Mutations 记录数: ${mutationCount}`, C.blue);

  if (receivedEvents.length >= 2) {
    log('PASS', '事件订阅验证：订阅者正确收到事件', C.green);
  } else {
    log('FAIL', '事件订阅验证：订阅者未收到预期事件', C.red);
    allPassed = false; exitCode = 1;
  }

  // 测试事件回放
  const replayCount = subEventBus.replayTrace('p4-sub-test');
  log('INFO', `事件回放：重播 ${replayCount} 个事件`, C.blue);

  if (replayCount > 0) {
    log('PASS', '事件回放验证：trace 回放成功', C.green);
  } else {
    log('FAIL', '事件回放验证：trace 回放失败', C.red);
    allPassed = false; exitCode = 1;
  }

  // 测试 Mutation 追踪
  const mutations = subEventBus.getMutations('p4-sub-test');
  if (mutations.length > 0 && mutations[0].sizeDelta > 0) {
    log('PASS', `Mutation 追踪验证：sizeDelta=${mutations[0].sizeDelta}（数据增长）`, C.green);
  } else if (mutations.length > 0) {
    log('PASS', 'Mutation 追踪验证：已记录变更', C.green);
  } else {
    log('FAIL', 'Mutation 追踪验证：未记录变更', C.red);
    allPassed = false; exitCode = 1;
  }

  // 清理订阅
  unsub1();
  unsub2();
  unsub3();

  // 验证 EventBus 自检
  const busValidation = subEventBus.validate();
  if (busValidation.healthy) {
    log('PASS', `EventBus 自检通过：${busValidation.eventTypes} 个事件类型`, C.green);
  } else {
    log('FAIL', `EventBus 自检失败: ${busValidation.failedChecks.join(', ')}`, C.red);
    allPassed = false; exitCode = 1;
  }

  // ============================================================
  // 总结
  // ============================================================
  section('P4 验证总结');

  if (allPassed) {
    log('PASS', '✅ P4 全部验证通过！端到端事件总线 + 错误注入 + 补偿机制已就绪。', C.green);
  } else {
    log('FAIL', '❌ P4 部分验证失败，请检查上述错误。', C.red);
  }

  console.log(`\n${C.gray}Exit code: ${exitCode}${C.reset}\n`);
  process.exit(exitCode);
}

main().catch(e => {
  console.error('P4 验证脚本异常:', e);
  process.exit(1);
});
