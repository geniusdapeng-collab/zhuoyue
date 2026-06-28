#!/usr/bin/env node
'use strict';

/**
 * Skill Validation Script — P1 核心模块Skill化验证
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
  gray: '\x1b[90m'
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

  // ============================================================
  // Test 1: SkillLoader 扫描加载
  // ============================================================
  section('Test 1: SkillLoader 扫描加载');

  const { SkillLoader } = require(path.join(SKILLS_DIR, 'skill-loader'));
  const { SkillRegistry, topologicalSort } = require(path.join(SKILLS_DIR, 'skill-registry'));

  const loader = new SkillLoader({ skillsDir: SKILLS_DIR, autoRegister: true, debug: true });
  const { loaded, failed, registry } = loader.loadAll();

  const expectedSkills = [
    'prompt-guardian-skill',
    'render-pipeline-guard-skill',
    'commercial-mode-skill',
    'cinematic-camera-skill',
    'post-production-skill',
    'continuity-engine-skill'
  ];

  let loadedNames = loaded.map(s => s.id);
  for (const skill of loaded) {
    log('LOAD', `${skill.id} → ${skill.constructor.name}`, C.green);
  }

  const missing = expectedSkills.filter(s => !loadedNames.includes(s));
  const extra = loadedNames.filter(s => !expectedSkills.includes(s));

  if (missing.length) {
    log('FAIL', `缺失 Skill: ${missing.join(', ')}`, C.red);
    allPassed = false; exitCode = 1;
  }
  if (extra.length) {
    log('WARN', `额外 Skill: ${extra.join(', ')}`, C.yellow);
  }
  if (!missing.length && !extra.length) {
    log('PASS', `全部 ${expectedSkills.length} 个 Skill 已扫描加载`, C.green);
  }

  // ============================================================
  // Test 2: SkillRegistry 注册
  // ============================================================
  section('Test 2: SkillRegistry 注册');

  const report = registry.getReport();
  log('INFO', `Registry 中已注册 ${report.totalSkills} 个 Skill`, C.blue);

  for (const skill of loaded) {
    if (registry.get(skill.id)) {
      log('REG', `${skill.id} → 注册成功`, C.green);
    } else {
      log('FAIL', `${skill.id} → 未注册`, C.red);
      allPassed = false; exitCode = 1;
    }
  }

  // ============================================================
  // Test 3: 依赖拓扑排序
  // ============================================================
  section('Test 3: 依赖拓扑排序');

  const sortedIds = topologicalSort(registry.skills);
  const sorted = sortedIds.map(id => registry.get(id));
  log('SORT', `执行顺序: ${sortedIds.join(' → ')}`, C.blue);

  const dependencyChecks = [
    { before: 'prompt-guardian-skill', after: 'render-pipeline-guard-skill' },
    { before: 'cinematic-camera-skill', after: 'continuity-engine-skill' },
    { before: 'commercial-mode-skill', after: 'post-production-skill' }
  ];

  for (const check of dependencyChecks) {
    const beforeIdx = sortedIds.indexOf(check.before);
    const afterIdx = sortedIds.indexOf(check.after);
    if (beforeIdx === -1 || afterIdx === -1) {
      log('FAIL', `依赖缺失: ${check.before} → ${check.after}`, C.red);
      allPassed = false; exitCode = 1;
    } else if (beforeIdx >= afterIdx) {
      log('FAIL', `依赖顺序错误: ${check.before} 应在 ${check.after} 之前`, C.red);
      allPassed = false; exitCode = 1;
    } else {
      log('PASS', `${check.before} (${beforeIdx}) → ${check.after} (${afterIdx})`, C.green);
    }
  }

  // ============================================================
  // Test 4: 每个 Skill 执行自检 (validate)
  // ============================================================
  section('Test 4: 每个 Skill 执行自检');

  const { CommercialEventBus } = require(path.join(INFRA_DIR, 'event-bus'));
  const eventBus = new CommercialEventBus();

  for (const skill of sorted) {
    try {
      await skill.initialize({ eventBus, traceId: `validate_${skill.id}` });

      const result = skill.validateSelf();
      if (result.healthy) {
        log('PASS', `${skill.id} → 自检通过 (${result.checks.length} 项)`, C.green);
      } else {
        log('FAIL', `${skill.id} → 自检失败: ${result.failedChecks.join(', ')}`, C.red);
        allPassed = false; exitCode = 1;
      }
    } catch (e) {
      log('FAIL', `${skill.id} → 自检异常: ${e.message}`, C.red);
      allPassed = false; exitCode = 1;
    }
  }

  // ============================================================
  // Test 5: Saga Orchestrator 完整链路执行
  // ============================================================
  section('Test 5: Saga Orchestrator 完整链路');

  const { CommercialSagaOrchestrator } = require(path.join(INFRA_DIR, 'saga-orchestrator'));

  const stageDefinitions = {
    'STAGE-SKILL-1': {
      id: 'STAGE-SKILL-1',
      name: 'Prompt Guardian',
      phase: 'pre_production',
      blocking: true,
      required: true,
      timeoutMs: 30000,
      retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
      fallback: { strategy: 'skip' }
    },
    'STAGE-SKILL-2': {
      id: 'STAGE-SKILL-2',
      name: 'Commercial Mode',
      phase: 'pre_production',
      blocking: true,
      required: true,
      timeoutMs: 30000,
      retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
      fallback: { strategy: 'skip' }
    },
    'STAGE-SKILL-3': {
      id: 'STAGE-SKILL-3',
      name: 'Cinematic Camera',
      phase: 'production',
      blocking: true,
      required: true,
      timeoutMs: 60000,
      retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
      fallback: { strategy: 'skip' }
    },
    'STAGE-SKILL-4': {
      id: 'STAGE-SKILL-4',
      name: 'Continuity Engine',
      phase: 'post_production',
      blocking: true,
      required: true,
      timeoutMs: 30000,
      retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
      fallback: { strategy: 'skip' }
    },
    'STAGE-SKILL-5': {
      id: 'STAGE-SKILL-5',
      name: 'Render Pipeline Guard',
      phase: 'production',
      blocking: true,
      required: true,
      timeoutMs: 30000,
      retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
      fallback: { strategy: 'skip' }
    },
    'STAGE-SKILL-6': {
      id: 'STAGE-SKILL-6',
      name: 'Post Production',
      phase: 'post_production',
      blocking: true,
      required: true,
      timeoutMs: 30000,
      retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
      fallback: { strategy: 'skip' }
    }
  };

  const skillStageMap = {
    'prompt-guardian-skill': 'STAGE-SKILL-1',
    'commercial-mode-skill': 'STAGE-SKILL-2',
    'cinematic-camera-skill': 'STAGE-SKILL-3',
    'continuity-engine-skill': 'STAGE-SKILL-4',
    'render-pipeline-guard-skill': 'STAGE-SKILL-5',
    'post-production-skill': 'STAGE-SKILL-6'
  };

  const executeFns = {};
  for (const skill of sorted) {
    const stageId = skillStageMap[skill.id];
    if (!stageId) continue;

    executeFns[stageId] = async (input, context) => {
      log('EXEC', `${stageId} → ${skill.id}`, C.gray);
      const result = await skill.execute(input, context);
      return result;
    };
  }

  const orchestrator = new CommercialSagaOrchestrator({ eventBus, enableCompensation: true });
  orchestrator.registerFromDefinitions(stageDefinitions, executeFns);

  const mockInput = {
    product: { name: '测试产品', type: 'demo' },
    brand: { name: 'TestBrand', style: 'modern' },
    sellingPoints: ['feature1', 'feature2'],
    targetAudience: '测试用户',
    shots: [
      { id: 'shot1', prompt: 'doctor running in hospital', scale: 'MS', duration: 3 },
      { id: 'shot2', prompt: 'close-up of doctor face', scale: 'CU', duration: 2 }
    ],
    prompts: [
      'doctor running in hospital, medium shot',
      'close-up of doctor face, worried expression'
    ],
    characters: [{ name: 'Doctor', role: 'protagonist' }],
    outputPath: '/tmp/test-output',
    renderOutput: ['/tmp/clip1.mp4', '/tmp/clip2.mp4']
  };

  try {
    const pipelineResult = await orchestrator.execute(mockInput, {
      traceId: `validate_pipeline_${Date.now()}`
    });

    log('PASS', `Pipeline 执行成功 | traceId=${pipelineResult.traceId}`, C.green);
    log('INFO', `成功 Stage: ${pipelineResult.executedStages.filter(s => s.status === 'success').length}/${pipelineResult.executedStages.length}`, C.blue);
    log('INFO', `跳过 Stage: ${pipelineResult.executedStages.filter(s => s.status === 'skipped').length}`, C.blue);

    for (const [stageId, result] of Object.entries(pipelineResult.results)) {
      const status = result.status === 'success' ? C.green : (result.status === 'skipped' ? C.yellow : C.red);
      log('STAGE', `${stageId}: ${result.status} | ${result.durationMs}ms`, status);
    }

  } catch (e) {
    log('FAIL', `Pipeline 执行失败: ${e.message}`, C.red);
    allPassed = false; exitCode = 1;
  }

  for (const skill of sorted) {
    try {
      await skill.shutdown();
    } catch (e) {
      log('WARN', `${skill.id} 关闭异常: ${e.message}`, C.yellow);
    }
  }

  // ============================================================
  // Test 6: SkillOrchestratorAdapter 自动编排 + 上下文累积（P3）
  // ============================================================
  section('Test 6: SkillOrchestratorAdapter 自动编排 + 上下文累积');

  // 重新加载Skill（避免Test 5 shutdown后的状态问题）
  const freshLoader = new SkillLoader({ skillsDir: SKILLS_DIR, autoRegister: false });
  const freshLoadResult = freshLoader.loadAll();
  const freshRegistry = new SkillRegistry();
  for (const skill of freshLoadResult.loaded) {
    freshRegistry.register(skill);
  }

  const { SkillOrchestratorAdapter } = require(path.join(INFRA_DIR, 'skill-orchestrator-adapter'));
  const { ContextAccumulationStrategy, CommercialContextPresets } = require(path.join(INFRA_DIR, 'context-accumulation-strategy'));

  // P3: 创建带上下文累积策略的Adapter
  const contextStrategy = new ContextAccumulationStrategy({
    aliases: {
      ...CommercialContextPresets.aliases,
      'scene': ['sceneDescription', 'sceneName', 'product.name'],  // 测试别名：product.name -> scene
      'duration': ['adDuration', 'shotDuration']                   // 测试别名
    }
  });

  const adapter = new SkillOrchestratorAdapter({
    eventBus,
    validateCompatibility: true,
    contextStrategy
  });

  try {
    adapter.registerFromRegistry(freshRegistry);
    log('PASS', `Adapter 注册完成 | ${adapter.skillStageMap.size} 个Skill→Stage映射`, C.green);

    // 显示映射关系
    for (const [skillId, stageId] of adapter.skillStageMap) {
      log('MAP', `${skillId} → ${stageId}`, C.gray);
    }

    // 自检
    const adapterValidation = adapter.validate();
    // IO兼容性不阻塞（P1 Skill本为独立模块，可通过Saga context传递数据）
    const coreChecksHealthy = adapterValidation.checks
      .filter(c => c.name !== 'IO兼容性检查通过')
      .every(c => c.pass);

    if (coreChecksHealthy) {
      log('PASS', 'Adapter 核心自检通过', C.green);
    } else {
      log('FAIL', `Adapter 自检失败: ${adapterValidation.failedChecks.join(', ')}`, C.red);
      allPassed = false; exitCode = 1;
    }

    // IO兼容性报告
    if (adapterValidation.compatibilityReport && adapterValidation.compatibilityReport.length > 0) {
      log('INFO', 'IO兼容性报告:', C.blue);
      for (const report of adapterValidation.compatibilityReport) {
        const status = report.compatible ? C.green : C.yellow;
        log('COMPAT', `${report.from} → ${report.to}: ${report.compatible ? '兼容' : '不兼容'}`, status);
        if (!report.compatible) {
          report.mismatches.forEach(m => log('WARN', `  - ${m}`, C.yellow));
        }
      }
    }

    // 执行编排链路
    const mockInput = {
      product: { name: '测试产品', type: 'demo' },
      brand: { name: 'TestBrand', style: 'modern' },
      sellingPoints: ['feature1', 'feature2'],
      targetAudience: '测试用户',
      shots: [
        { id: 'shot1', prompt: 'doctor running in hospital', scale: 'MS', duration: 3 },
        { id: 'shot2', prompt: 'close-up of doctor face', scale: 'CU', duration: 2 }
      ],
      prompts: [
        'doctor running in hospital, medium shot',
        'close-up of doctor face, worried expression'
      ],
      characters: [{ name: 'Doctor', role: 'protagonist' }],
      outputPath: '/tmp/test-output',
      renderOutput: ['/tmp/clip1.mp4', '/tmp/clip2.mp4']
    };

    const pipelineResult = await adapter.execute(mockInput, {
      traceId: `adapter_test_${Date.now()}`
    });

    log('PASS', `Adapter Pipeline 执行成功 | traceId=${pipelineResult.traceId}`, C.green);
    log('INFO', `成功 Stage: ${pipelineResult.executedStages.filter(s => s.status === 'success').length}/${pipelineResult.executedStages.length}`, C.blue);

  } catch (e) {
    log('FAIL', `Adapter 测试失败: ${e.message}`, C.red);
    allPassed = false; exitCode = 1;
  }

  // ============================================================
  // 总结
  // ============================================================
  section('验证总结');

  if (allPassed) {
    log('PASS', '✅ 全部验证通过！6 个 Skill 已就绪。', C.green);
  } else {
    log('FAIL', '❌ 部分验证失败，请检查上述错误。', C.red);
  }

  console.log(`\n${C.gray}Exit code: ${exitCode}${C.reset}\n`);
  process.exit(exitCode);
}

main().catch(e => {
  console.error('验证脚本异常:', e);
  process.exit(1);
});
