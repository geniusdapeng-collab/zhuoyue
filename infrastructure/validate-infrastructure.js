#!/usr/bin/env node
/**
 * 基础设施验证脚本
 * 测试所有新创建的基础设施模块能正常加载和自检
 */

'use strict';

const path = require('path');
const fs = require('fs');

const BASE_DIR = path.join(__dirname, '..');
const INFRA_DIR = path.join(BASE_DIR, 'infrastructure');
const SKILLS_DIR = path.join(BASE_DIR, 'skills');

const RESULTS = {
  passed: 0,
  failed: 0,
  errors: []
};

function logPass(msg) {
  RESULTS.passed++;
  console.log(`  ✅ ${msg}`);
}

function logFail(msg, err) {
  RESULTS.failed++;
  RESULTS.errors.push({ msg, error: err?.message || err });
  console.log(`  ❌ ${msg}`);
  if (err) console.log(`     ${err.message || err}`);
}

function section(name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${'='.repeat(60)}`);
}

// ============================================================
// 1. 文件存在性检查
// ============================================================

section('1. 文件存在性检查');

const requiredFiles = [
  path.join(SKILLS_DIR, 'skill-base.js'),
  path.join(SKILLS_DIR, 'skill-registry.js'),
  path.join(SKILLS_DIR, 'skill-loader.js'),
  path.join(INFRA_DIR, 'saga-orchestrator.js'),
  path.join(INFRA_DIR, 'llm-gateway.js'),
  path.join(INFRA_DIR, 'event-bus.js'),
  path.join(INFRA_DIR, 'index.js')
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    logPass(`文件存在: ${path.basename(file)}`);
  } else {
    logFail(`文件缺失: ${path.basename(file)}`);
  }
}

// ============================================================
// 2. Skill Base 模块测试
// ============================================================

section('2. Skill Base 模块');

try {
  const { SkillBase, ModuleToSkillAdapter, SKILL_STATUS } = require(path.join(SKILLS_DIR, 'skill-base'));

  // 检查导出
  if (typeof SkillBase === 'function') logPass('SkillBase 类已导出');
  else logFail('SkillBase 类未导出');

  if (typeof ModuleToSkillAdapter === 'function') logPass('ModuleToSkillAdapter 已导出');
  else logFail('ModuleToSkillAdapter 未导出');

  if (SKILL_STATUS && SKILL_STATUS.READY) logPass('SKILL_STATUS 枚举已导出');
  else logFail('SKILL_STATUS 枚举未导出');

  // 实例化测试
  const skill = new SkillBase({
    name: 'TestSkill',
    version: '1.0.0',
    description: '测试Skill',
    category: 'pre_production'
  });

  if (skill.name === 'TestSkill') logPass('Skill 属性正确');
  else logFail('Skill 属性不正确');

  // 自检
  const selfCheck = skill.validateSelf();
  if (selfCheck.healthy) logPass('Skill 自检通过');
  else logFail('Skill 自检失败', new Error(selfCheck.failedChecks.join(', ')));

  // 元数据
  const meta = skill.getMetadata();
  if (meta.name === 'TestSkill' && meta.status === SKILL_STATUS.PENDING) logPass('Skill 元数据正确');
  else logFail('Skill 元数据不正确');

} catch (e) {
  logFail('Skill Base 模块加载失败', e);
}

// ============================================================
// 3. Skill Registry 模块测试
// ============================================================

section('3. Skill Registry 模块');

try {
  const { SkillRegistry, topologicalSort } = require(path.join(SKILLS_DIR, 'skill-registry'));
  const { SkillBase } = require(path.join(SKILLS_DIR, 'skill-base'));

  if (typeof SkillRegistry === 'function') logPass('SkillRegistry 已导出');
  else logFail('SkillRegistry 未导出');

  // 拓扑排序测试
  const skills = new Map();
  const S = class extends SkillBase { constructor() { super({ name: 'S' }); } };
  const A = class extends SkillBase { constructor() { super({ name: 'A', dependencies: ['S'] }); } };
  const B = class extends SkillBase { constructor() { super({ name: 'B', dependencies: ['A'] }); } };

  skills.set('S', new S());
  skills.set('A', new A());
  skills.set('B', new B());

  const sorted = topologicalSort(skills);
  if (JSON.stringify(sorted) === JSON.stringify(['S', 'A', 'B'])) logPass('拓扑排序正确');
  else logFail('拓扑排序不正确', new Error(`得到: ${sorted.join(', ')}`));

  // 注册表功能测试
  const registry = new SkillRegistry();
  registry.register(new S());
  registry.register(new A());
  registry.register(new B());

  if (registry.skills.size === 3) logPass('Skill 注册成功');
  else logFail('Skill 注册失败');

  // 健康检查
  const health = registry.validateAll();
  if (health.healthy === 3) logPass('Registry 健康检查通过');
  else logFail('Registry 健康检查失败');

  // 报告
  const report = registry.getReport();
  if (report.totalSkills === 3) logPass('Registry 报告生成正确');
  else logFail('Registry 报告生成失败');

} catch (e) {
  logFail('Skill Registry 模块测试失败', e);
}

// ============================================================
// 4. Skill Loader 模块测试
// ============================================================

section('4. Skill Loader 模块');

try {
  const { SkillLoader, loadAllSkills } = require(path.join(SKILLS_DIR, 'skill-loader'));

  if (typeof SkillLoader === 'function') logPass('SkillLoader 已导出');
  else logFail('SkillLoader 未导出');

  if (typeof loadAllSkills === 'function') logPass('loadAllSkills 已导出');
  else logFail('loadAllSkills 未导出');

  // 扫描测试
  const loader = new SkillLoader({ skillsDir: SKILLS_DIR, autoRegister: false });
  const discovered = loader.scan();
  if (discovered.length >= 0) logPass(`Skill扫描完成，发现 ${discovered.length} 个目录`);
  else logFail('Skill扫描异常');

  const report = loader.getReport();
  if (report.skillsDir === SKILLS_DIR) logPass('Loader 报告正确');
  else logFail('Loader 报告不正确');

} catch (e) {
  logFail('Skill Loader 模块测试失败', e);
}

// ============================================================
// 5. Saga Orchestrator 模块测试
// ============================================================

section('5. Saga Orchestrator 模块');

(async () => {
  try {
    const { CommercialSagaOrchestrator, COMMERCIAL_STAGE_DEFINITIONS, createCommercialOrchestrator } = require(path.join(INFRA_DIR, 'saga-orchestrator'));

    if (typeof CommercialSagaOrchestrator === 'function') logPass('CommercialSagaOrchestrator 已导出');
    else logFail('CommercialSagaOrchestrator 未导出');

    if (COMMERCIAL_STAGE_DEFINITIONS && COMMERCIAL_STAGE_DEFINITIONS['STAGE-CM-1']) logPass('商业广告Stage定义已导出');
    else logFail('商业广告Stage定义未导出');

    // 自检：空注册表
    const orch = new CommercialSagaOrchestrator();
    let v = orch.validate();
    if (!v.healthy) logPass('空注册表自检正确（预期不通过）');
    else logFail('空注册表自检异常');

    // 注册Stage并自检
    orch.registerStage(COMMERCIAL_STAGE_DEFINITIONS['STAGE-CM-1'], async () => ({ requirements: {} }));
    orch.registerStage(COMMERCIAL_STAGE_DEFINITIONS['STAGE-CM-2'], async () => ({ structure: {} }));

    v = orch.validate();
    if (v.healthy) logPass('注册Stage后自检通过');
    else logFail('注册Stage后自检失败', new Error(v.failedChecks.join(', ')));

    // 完整执行测试
    const result = await orch.execute({ brand: 'TestBrand' }, {
      stageOrder: ['STAGE-CM-1', 'STAGE-CM-2']
    });
    if (result.success && result.traceId) logPass('Pipeline执行成功');
    else logFail('Pipeline执行失败');

    // 补偿测试
    const orch2 = new CommercialSagaOrchestrator({ enableCompensation: true });
    let compensated = false;
    orch2.registerStage({
      ...COMMERCIAL_STAGE_DEFINITIONS['STAGE-CM-3'],
      compensate: async () => { compensated = true; }
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
      if (compensated) logPass('补偿事务执行成功');
      else logFail('补偿事务未执行');
    }

    // createCommercialOrchestrator便捷函数
    const quick = createCommercialOrchestrator({
      'STAGE-CM-1': async () => ({ req: {} })
    });
    if (quick.stages.has('STAGE-CM-1')) logPass('createCommercialOrchestrator 工作正常');
    else logFail('createCommercialOrchestrator 工作异常');

  } catch (e) {
    logFail('Saga Orchestrator 模块测试失败', e);
  }

  // ============================================================
  // 6. LLM Gateway 模块测试
  // ============================================================

  section('6. LLM Gateway 模块');

  try {
    const { LLMGateway, CircuitBreaker, JSONSafeParser, LLMEngineWrapper, CB_STATE } = require(path.join(INFRA_DIR, 'llm-gateway'));

    if (typeof LLMGateway === 'function') logPass('LLMGateway 已导出');
    else logFail('LLMGateway 未导出');

    if (typeof CircuitBreaker === 'function') logPass('CircuitBreaker 已导出');
    else logFail('CircuitBreaker 未导出');

    if (typeof JSONSafeParser === 'function') logPass('JSONSafeParser 已导出');
    else logFail('JSONSafeParser 未导出');

    // 熔断器测试
    const cb = new CircuitBreaker('test', { failureThreshold: 3, recoveryTimeoutMs: 1000 });
    for (let i = 0; i < 3; i++) {
      try { await cb.execute(async () => { throw new Error('fail'); }); } catch (e) {}
    }
    if (cb.getStats().state === CB_STATE.OPEN) logPass('熔断器状态切换正确');
    else logFail('熔断器状态切换不正确');

    // JSON解析测试
    const badJson = '{"a": 1, "b": 2,}';
    const parsed = JSONSafeParser.parse(badJson);
    if (parsed.success && parsed.data.a === 1) logPass('JSON安全解析正确');
    else logFail('JSON安全解析失败');

    // Gateway自检
    const gw = new LLMGateway();
    let v = gw.validate();
    if (!v.healthy) logPass('未初始化Gateway自检正确（预期）');
    else logFail('未初始化Gateway自检异常');

    await gw.initialize();
    v = gw.validate();
    if (v.healthy) logPass('初始化后Gateway自检通过');
    else logFail('初始化后Gateway自检失败', new Error(v.failedChecks.join(', ')));

    // 兼容包装器
    const wrapper = new LLMEngineWrapper();
    const mockResult = await wrapper.reason('请生成商业广告剧本');
    if (mockResult.success && mockResult.content.length > 0) logPass('LLMEngineWrapper Mock模式正常');
    else logFail('LLMEngineWrapper Mock模式异常');

  } catch (e) {
    logFail('LLM Gateway 模块测试失败', e);
  }

  // ============================================================
  // 7. Event Bus 模块测试
  // ============================================================

  section('7. Event Bus 模块');

  try {
    const { CommercialEventBus, COMMERCIAL_EVENT_DEFINITIONS } = require(path.join(INFRA_DIR, 'event-bus'));

    if (typeof CommercialEventBus === 'function') logPass('CommercialEventBus 已导出');
    else logFail('CommercialEventBus 未导出');

    if (COMMERCIAL_EVENT_DEFINITIONS['commercial.product.analyzed']) logPass('商业广告事件定义已导出');
    else logFail('商业广告事件定义未导出');

    // 自检
    const bus = new CommercialEventBus({ name: 'test', debug: false });
    const v = bus.validate();
    if (v.healthy) logPass('EventBus自检通过');
    else logFail('EventBus自检失败');

    // 发布/订阅
    let received = null;
    const unsub = bus.subscribe('commercial.product.analyzed', (payload) => {
      received = payload;
    });
    bus.publish('commercial.product.analyzed', {
      productName: 'Test',
      sellingPoints: ['SP1'],
      targetAudience: 'all'
    }, { traceId: 't1' });
    await new Promise(r => setTimeout(r, 50));
    if (received && received.productName === 'Test') logPass('事件发布/订阅正常');
    else logFail('事件发布/订阅失败');
    unsub();

    // Mutations追踪
    bus.recordMutation('trace-001', {
      stageId: 'STAGE-CM-3',
      shotId: 'S01',
      field: 'script',
      previousValue: 'old',
      newValue: 'new content here'
    });
    const mutations = bus.getMutations('trace-001');
    if (mutations.length === 1 && mutations[0].field === 'script') logPass('Mutations追踪正常');
    else logFail('Mutations追踪失败');

    // 事件回放
    bus.publish('stage.completed', { stageId: 'STAGE-CM-1', traceId: 'replay', status: 'success' }, { traceId: 'replay' });
    const replayed = bus.replayTrace('replay');
    if (replayed >= 1) logPass('事件回放正常');
    else logFail('事件回放失败');

    // 报告
    const report = bus.getReport();
    if (report.totalEvents > 0) logPass('统计报告生成正常');
    else logFail('统计报告生成失败');

  } catch (e) {
    logFail('Event Bus 模块测试失败', e);
  }

  // ============================================================
  // 8. Infrastructure Index 测试
  // ============================================================

  section('8. Infrastructure Index 统一出口');

  try {
    const infra = require(path.join(INFRA_DIR, 'index'));

    const requiredExports = [
      'CommercialEventBus',
      'CommercialSagaOrchestrator',
      'LLMGateway',
      'CircuitBreaker',
      'KimiProviderAdapter',
      'OpenAIProviderAdapter',
      'JSONSafeParser',
      'LLMEngineWrapper',
      'getLLMGateway',
      'callLLM'
    ];

    for (const name of requiredExports) {
      if (infra[name] !== undefined) {
        logPass(`导出项存在: ${name}`);
      } else {
        logFail(`导出项缺失: ${name}`);
      }
    }

  } catch (e) {
    logFail('Infrastructure Index 加载失败', e);
  }

  // ============================================================
  // 9. 集成测试 —— 所有模块协同工作
  // ============================================================

  section('9. 集成测试 — 模块协同');

  try {
    const { CommercialEventBus } = require(path.join(INFRA_DIR, 'event-bus'));
    const { CommercialSagaOrchestrator, COMMERCIAL_STAGE_DEFINITIONS } = require(path.join(INFRA_DIR, 'saga-orchestrator'));
    const { LLMGateway } = require(path.join(INFRA_DIR, 'llm-gateway'));

    // 创建共享EventBus
    const eventBus = new CommercialEventBus({ name: 'integration-test' });

    // 创建Gateway并注入EventBus
    const gw = new LLMGateway();
    await gw.initialize({ eventBus });

    // 创建Orchestrator并注入EventBus
    const orch = new CommercialSagaOrchestrator({ eventBus, publishEvents: true });

    // 监听商业广告事件
    let productAnalyzed = false;
    eventBus.subscribe('commercial.product.analyzed', () => { productAnalyzed = true; });

    // 注册Stage并执行
    orch.registerStage(COMMERCIAL_STAGE_DEFINITIONS['STAGE-CM-1'], async (input, ctx) => {
      // 模拟商业分析完成后发布事件（通过闭包引用外部eventBus）
      eventBus.publish('commercial.product.analyzed', {
        productName: input.brand || 'Unknown',
        sellingPoints: ['quality', 'value'],
        targetAudience: 'general'
      }, { traceId: ctx.traceId });
      return { requirements: { analyzed: true } };
    });

    orch.registerStage(COMMERCIAL_STAGE_DEFINITIONS['STAGE-CM-2'], async () => ({ structure: { acts: 3 } }));

    const result = await orch.execute({ brand: 'IntegrationTest' }, {
      stageOrder: ['STAGE-CM-1', 'STAGE-CM-2']
    });

    if (result.success && result.context.requirements?.analyzed) logPass('Pipeline + EventBus 集成正常');
    else logFail('Pipeline + EventBus 集成失败');

    if (productAnalyzed) logPass('商业广告事件发布/订阅集成正常');
    else logFail('商业广告事件未触发');

    // Gateway + EventBus集成
    const gwStats = gw.getStats();
    if (gwStats.initialized) logPass('Gateway + EventBus 集成正常');
    else logFail('Gateway + EventBus 集成失败');

  } catch (e) {
    logFail('集成测试失败', e);
  }

  // ============================================================
  // 总结报告
  // ============================================================

  section('验证总结');

  console.log(`\n  总计测试: ${RESULTS.passed + RESULTS.failed}`);
  console.log(`  ✅ 通过: ${RESULTS.passed}`);
  console.log(`  ❌ 失败: ${RESULTS.failed}`);

  if (RESULTS.errors.length > 0) {
    console.log(`\n  错误详情:`);
    RESULTS.errors.forEach((err, i) => {
      console.log(`    ${i + 1}. ${err.msg}`);
      if (err.error) console.log(`       ${err.error}`);
    });
  }

  const exitCode = RESULTS.failed > 0 ? 1 : 0;
  console.log(`\n${exitCode === 0 ? '🎉 所有基础设施模块验证通过！' : '⚠️ 部分测试未通过，请检查。'}`);

  process.exit(exitCode);
})();
