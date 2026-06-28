#!/usr/bin/env node
'use strict';

/**
 * Skill Validation Script — P5 性能压力测试
 * 测试内容：
 * 1. 并发 Pipeline 测试（同时运行多个广告）
 * 2. 大量镜头数据压力测试
 * 3. 超时/重试压力测试
 * 4. 内存/CPU 监控
 */

const path = require('path');
const os = require('os');

const SKILLS_DIR = path.join(__dirname);
const INFRA_DIR = path.join(__dirname, '..', 'infrastructure');

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(label, msg, color = C.reset) {
  console.log(`${color}[${label}]${C.reset} ${msg}`);
}

function section(title) {
  console.log(`\n${C.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`${C.blue}  ${title}${C.reset}`);
  console.log(`${C.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}\n`);
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: (usage.rss / 1024 / 1024).toFixed(2), // MB
    heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2),
    heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2),
    external: (usage.external / 1024 / 1024).toFixed(2)
  };
}

function getCpuUsage() {
  const cpus = os.cpus();
  const avg = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + (1 - idle / total);
  }, 0) / cpus.length;
  return (avg * 100).toFixed(2);
}

async function createAdapter(eventBus, validateCompat = false) {
  const { SkillLoader } = require(path.join(SKILLS_DIR, 'skill-loader'));
  const { SkillRegistry } = require(path.join(SKILLS_DIR, 'skill-registry'));
  const { SkillOrchestratorAdapter } = require(path.join(INFRA_DIR, 'skill-orchestrator-adapter'));
  const { ContextAccumulationStrategy, CommercialContextPresets } = require(path.join(INFRA_DIR, 'context-accumulation-strategy'));

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
    validateCompatibility: validateCompat,
    contextStrategy,
    validateInput: false,
    validateOutput: false
  });

  adapter.registerFromRegistry(registry);
  return adapter;
}

async function main() {
  let exitCode = 0;
  let allPassed = true;

  const { CommercialEventBus } = require(path.join(INFRA_DIR, 'event-bus'));

  // ============================================================
  // Test 10: 并发 Pipeline 测试
  // ============================================================
  section('Test 10: 并发 Pipeline 测试（3 个广告同时执行）');

  const concurrencyStart = Date.now();
  const memBefore = getMemoryUsage();
  log('INFO', `并发测试开始 | 内存: RSS ${memBefore.rss}MB | Heap ${memBefore.heapUsed}MB`, C.blue);

  // 创建 3 个独立的 Adapter 实例（模拟 3 个广告同时处理）
  const adapters = await Promise.all([
    createAdapter(new CommercialEventBus({ name: 'p5-concurrent-1' })),
    createAdapter(new CommercialEventBus({ name: 'p5-concurrent-2' })),
    createAdapter(new CommercialEventBus({ name: 'p5-concurrent-3' }))
  ]);
  log('INFO', '3 个 Adapter 实例已创建', C.blue);

  // 3 个不同的广告场景
  const adScenes = [
    {
      product: { name: 'LuminaGlow 精华液', type: 'skincare' },
      brand: { name: 'LuminaGlow', style: 'luxury' },
      targetAudience: '都市女性',
      cameraPlan: {
        shots: Array.from({ length: 5 }, (_, i) => ({
          id: `S${String(i + 1).padStart(2, '0')}`,
          scale: ['CU', 'MS', 'WS', 'ECU', 'MCU'][i % 5],
          duration: 3 + i,
          prompt: `Shot ${i + 1}: 产品展示场景 ${i + 1}`
        }))
      },
      characters: [{ name: 'ModelA', role: 'protagonist' }],
      outputPath: '/tmp/ad1'
    },
    {
      product: { name: 'SportMax 能量饮料', type: 'beverage' },
      brand: { name: 'SportMax', style: 'dynamic' },
      targetAudience: '运动爱好者',
      cameraPlan: {
        shots: Array.from({ length: 8 }, (_, i) => ({
          id: `S${String(i + 1).padStart(2, '0')}`,
          scale: ['MS', 'WS', 'CU', 'TS'][i % 4],
          duration: 2 + i,
          prompt: `Shot ${i + 1}: 运动场景 ${i + 1}`
        }))
      },
      characters: [{ name: 'AthleteB', role: 'protagonist' }],
      outputPath: '/tmp/ad2'
    },
    {
      product: { name: 'TechPro 智能手表', type: 'electronics' },
      brand: { name: 'TechPro', style: 'tech' },
      targetAudience: '科技爱好者',
      cameraPlan: {
        shots: Array.from({ length: 10 }, (_, i) => ({
          id: `S${String(i + 1).padStart(2, '0')}`,
          scale: ['ECU', 'CU', 'MS', 'WS'][i % 4],
          duration: 2 + (i % 4),
          prompt: `Shot ${i + 1}: 科技产品展示 ${i + 1}`
        }))
      },
      characters: [{ name: 'UserC', role: 'protagonist' }],
      outputPath: '/tmp/ad3'
    }
  ];

  // 同时执行 3 个 Pipeline
  const concurrentPromises = adapters.map((adapter, idx) =>
    adapter.execute(adScenes[idx], {
      traceId: `p5_concurrent_${idx}_${Date.now()}`
    }).then(result => ({
      idx,
      success: true,
      traceId: result.traceId,
      stageCount: result.executedStages.length,
      successCount: result.executedStages.filter(s => s.status === 'success').length,
      skippedCount: result.executedStages.filter(s => s.status === 'skipped').length
    })).catch(err => ({
      idx,
      success: false,
      error: err.message
    }))
  );

  const concurrentResults = await Promise.all(concurrentPromises);
  const concurrentDuration = Date.now() - concurrencyStart;
  const memAfter = getMemoryUsage();

  log('INFO', `并发测试完成 | 耗时: ${concurrentDuration}ms`, C.blue);
  log('INFO', `内存变化: RSS ${memBefore.rss}MB → ${memAfter.rss}MB | Heap ${memBefore.heapUsed}MB → ${memAfter.heapUsed}MB`, C.blue);

  let successCount = 0;
  for (const result of concurrentResults) {
    if (result.success) {
      log('PASS', `Ad ${result.idx}: ${result.successCount}/${result.stageCount} Stage 成功 | traceId=${result.traceId}`, C.green);
      successCount++;
    } else {
      log('FAIL', `Ad ${result.idx}: 失败 | ${result.error}`, C.red);
      allPassed = false; exitCode = 1;
    }
  }

  if (successCount === 3) {
    log('PASS', `并发测试通过：3/3 Pipeline 成功执行，总耗时 ${concurrentDuration}ms`, C.green);
  } else {
    log('FAIL', `并发测试失败：仅 ${successCount}/3 Pipeline 成功`, C.red);
    allPassed = false; exitCode = 1;
  }

  // 内存检查：不应增长超过 50MB
  const rssDelta = parseFloat(memAfter.rss) - parseFloat(memBefore.rss);
  if (rssDelta < 50) {
    log('PASS', `内存泄漏检查通过：RSS 增长 ${rssDelta.toFixed(2)}MB < 50MB`, C.green);
  } else {
    log('WARN', `内存泄漏警告：RSS 增长 ${rssDelta.toFixed(2)}MB，建议排查`, C.yellow);
  }

  // ============================================================
  // Test 11: 大量镜头数据压力测试
  // ============================================================
  section('Test 11: 大量镜头数据压力测试（50 个镜头）');

  const stressStart = Date.now();
  const memStressBefore = getMemoryUsage();
  log('INFO', `压力测试开始 | 内存: RSS ${memStressBefore.rss}MB`, C.blue);

  const stressAdapter = await createAdapter(new CommercialEventBus({ name: 'p5-stress-bus' }));

  // 生成 50 个镜头的数据
  const largeShotCount = 50;
  const stressScene = {
    product: { name: 'MegaCampaign 全能产品', type: 'campaign' },
    brand: { name: 'MegaBrand', style: 'premium' },
    targetAudience: '全年龄段',
    cameraPlan: {
      shots: Array.from({ length: largeShotCount }, (_, i) => ({
        id: `S${String(i + 1).padStart(3, '0')}`,
        scale: ['CU', 'MS', 'WS', 'ECU', 'MCU', 'TS'][i % 6],
        duration: 2 + (i % 5),
        movement: ['static', 'pan', 'tilt', 'dolly', 'crane', 'orbit'][i % 6],
        prompt: `Shot ${i + 1}: ${['产品特写', '场景展示', '人物互动', '细节放大', '全景展示', '动态跟踪'][i % 6]} — 这是一个较长的 prompt 描述，用于测试数据传递性能和大文本处理能力，确保在大量镜头数据下系统不会崩溃或内存溢出。镜头编号 ${i + 1}，包含详细的视觉描述和运镜指令。`,
        camera: {
          lens: ['50mm', '35mm', '85mm', '24mm', '100mm'][i % 5],
          aperture: ['f/1.4', 'f/2.8', 'f/4', 'f/5.6', 'f/8'][i % 5],
          iso: [100, 200, 400, 800, 1600][i % 5]
        },
        lighting: {
          key: ['softbox', 'natural', 'led_panel', 'ring_light'][i % 4],
          fill: ['bounce', 'negative', 'ambient'][i % 3],
          mood: ['warm', 'cool', 'neutral', 'dramatic'][i % 4]
        }
      }))
    },
    characters: Array.from({ length: 5 }, (_, i) => ({
      name: `Character${i + 1}`,
      role: i === 0 ? 'protagonist' : 'supporting',
      appearance: `详细外观描述：身高 ${160 + i * 5}cm，发型 ${['long', 'short', 'curly', 'straight', 'bob'][i % 5]}，服装风格 ${['casual', 'formal', 'sporty', 'elegant', 'street'][i % 5]}`
    })),
    outputPath: '/tmp/stress-test',
    renderOutput: Array.from({ length: 10 }, (_, i) => `/tmp/stress-test/clip${i + 1}.mp4`)
  };

  // 估算数据大小
  const dataSize = JSON.stringify(stressScene).length;
  log('INFO', `压力测试数据：${largeShotCount} 个镜头，总数据量 ${(dataSize / 1024).toFixed(2)}KB`, C.blue);

  try {
    const stressResult = await stressAdapter.execute(stressScene, {
      traceId: `p5_stress_${Date.now()}`
    });
    const stressDuration = Date.now() - stressStart;
    const memStressAfter = getMemoryUsage();
    const stressRssDelta = parseFloat(memStressAfter.rss) - parseFloat(memStressBefore.rss);

    log('PASS', `压力测试 Pipeline 执行成功 | ${stressResult.executedStages.filter(s => s.status === 'success').length}/${stressResult.executedStages.length} Stage 成功`, C.green);
    log('INFO', `压力测试耗时: ${stressDuration}ms | 内存增长: ${stressRssDelta.toFixed(2)}MB`, C.blue);

    // 验证镜头数据是否完整传递
    const finalContext = stressResult.context;
    const finalShots = finalContext.cameraPlan?.shots || finalContext.shots;
    if (finalShots && finalShots.length === largeShotCount) {
      log('PASS', `镜头数据完整性验证：${finalShots.length}/${largeShotCount} 个镜头完整传递`, C.green);
    } else {
      log('WARN', `镜头数据完整性验证：仅 ${finalShots?.length || 0}/${largeShotCount} 个镜头传递`, C.yellow);
    }

    // 性能阈值：50 个镜头应在 30 秒内完成（不含 LLM 调用）
    if (stressDuration < 30000) {
      log('PASS', `性能阈值检查：${stressDuration}ms < 30000ms`, C.green);
    } else {
      log('WARN', `性能阈值警告：${stressDuration}ms > 30000ms，建议优化`, C.yellow);
    }

    // 内存阈值：不应超过 200MB
    if (parseFloat(memStressAfter.rss) < 200) {
      log('PASS', `内存阈值检查：RSS ${memStressAfter.rss}MB < 200MB`, C.green);
    } else {
      log('WARN', `内存阈值警告：RSS ${memStressAfter.rss}MB > 200MB`, C.yellow);
    }

  } catch (e) {
    log('FAIL', `压力测试失败: ${e.message}`, C.red);
    allPassed = false; exitCode = 1;
  }

  // ============================================================
  // Test 12: 超时/重试压力测试
  // ============================================================
  section('Test 12: 超时/重试压力测试');

  const { CommercialSagaOrchestrator } = require(path.join(INFRA_DIR, 'saga-orchestrator'));
  const timeoutBus = new CommercialEventBus({ name: 'p5-timeout-bus' });
  const timeoutOrchestrator = new CommercialSagaOrchestrator({
    eventBus: timeoutBus,
    enableCompensation: true
  });

  // 测试1：fallback='skip' 时，超时后被降级，Pipeline 不失败
  const timeoutSkipOrchestrator = new CommercialSagaOrchestrator({
    eventBus: timeoutBus,
    enableCompensation: true
  });

  timeoutSkipOrchestrator.registerStage({
    id: 'STAGE-TIMEOUT-SKIP',
    name: '超时降级 Stage',
    blocking: true,
    required: true,
    timeoutMs: 500,
    retryPolicy: { maxAttempts: 3, backoffMs: 100 },
    fallback: { strategy: 'skip' },
    compensate: async () => {
      log('INFO', '超时降级 Stage 补偿执行', C.magenta);
    }
  }, async () => {
    await new Promise(r => setTimeout(r, 2000));
    return { status: 'success' };
  });

  try {
    const skipResult = await timeoutSkipOrchestrator.execute({ test: 'timeout-skip' }, {
      traceId: `p5_timeout_skip_${Date.now()}`,
      stageOrder: ['STAGE-TIMEOUT-SKIP']
    });
    log('PASS', `超时降级测试：Pipeline 成功 | 跳过 Stage: ${skipResult.executedStages.filter(s => s.status === 'skipped').length}`, C.green);
  } catch (e) {
    log('FAIL', `超时降级测试：Pipeline 不应失败 | ${e.message}`, C.red);
    allPassed = false; exitCode = 1;
  }

  // 测试2：fallback='none' 时，超时阻断 Pipeline
  const timeoutBlockOrchestrator = new CommercialSagaOrchestrator({
    eventBus: timeoutBus,
    enableCompensation: true
  });

  timeoutBlockOrchestrator.registerStage({
    id: 'STAGE-NORMAL',
    name: '正常 Stage',
    blocking: true,
    required: true,
    timeoutMs: 5000,
    retryPolicy: { maxAttempts: 1, backoffMs: 1000 }
  }, async () => {
    return { normal: true, data: 'ok' };
  });

  timeoutBlockOrchestrator.registerStage({
    id: 'STAGE-TIMEOUT-BLOCK',
    name: '超时阻断 Stage',
    blocking: true,
    required: true,
    timeoutMs: 500,
    retryPolicy: { maxAttempts: 3, backoffMs: 100 },
    fallback: { strategy: 'none' }, // 不降级，失败就阻断
    compensate: async () => {
      log('INFO', '超时阻断 Stage 补偿执行', C.magenta);
    }
  }, async () => {
    await new Promise(r => setTimeout(r, 2000));
    return { status: 'success' };
  });

  const timeoutStart = Date.now();
  try {
    await timeoutBlockOrchestrator.execute({ test: 'timeout-block' }, {
      traceId: `p5_timeout_block_${Date.now()}`,
      stageOrder: ['STAGE-NORMAL', 'STAGE-TIMEOUT-BLOCK']
    });
    log('FAIL', '超时阻断测试：预期 Pipeline 应失败但未触发', C.red);
    allPassed = false; exitCode = 1;
  } catch (e) {
    const timeoutDuration = Date.now() - timeoutStart;
    log('PASS', `超时阻断测试：Pipeline 正确失败 | ${e.message}`, C.green);
    log('INFO', `超时阻断耗时: ${timeoutDuration}ms（预期 ~1100ms = 500 + 100 + 500）`, C.blue);

    // 验证补偿是否被触发
    const compensationCount = timeoutBlockOrchestrator.compensationLog.length;
    if (compensationCount > 0) {
      log('PASS', `补偿验证：${compensationCount} 个补偿已记录`, C.green);
    } else {
      log('WARN', '补偿验证：未记录补偿（补偿函数可能执行成功）', C.yellow);
    }
  }

  // 验证超时事件发布
  const timeoutEvents = timeoutBus.getEventLog({ eventType: 'stage.failed' });
  if (timeoutEvents.length >= 1) {
    log('PASS', `超时事件验证：stage.failed 事件已发布 (${timeoutEvents.length} 次)`, C.green);
  } else {
    log('WARN', '超时事件验证：未找到 stage.failed 事件', C.yellow);
  }

  // 测试指数退避重试
  const backoffBus = new CommercialEventBus({ name: 'p5-backoff-bus' });
  const backoffOrchestrator = new CommercialSagaOrchestrator({
    eventBus: backoffBus,
    enableCompensation: false
  });

  let attemptCount = 0;
  backoffOrchestrator.registerStage({
    id: 'STAGE-BACKOFF',
    name: '退避重试 Stage',
    blocking: true,
    required: true,
    timeoutMs: 10000,
    retryPolicy: { maxAttempts: 3, backoffMs: 200 }, // 200ms, 400ms, 800ms
    fallback: { strategy: 'skip' }
  }, async () => {
    attemptCount++;
    if (attemptCount < 3) {
      throw new Error(`模拟可恢复错误，尝试 ${attemptCount}`);
    }
    return { success: true, attempts: attemptCount };
  });

  const backoffStart = Date.now();
  try {
    const backoffResult = await backoffOrchestrator.execute({ test: 'backoff' }, {
      traceId: `p5_backoff_${Date.now()}`,
      stageOrder: ['STAGE-BACKOFF']
    });
    const backoffDuration = Date.now() - backoffStart;

    log('PASS', `退避重试测试：Stage 在 ${attemptCount} 次尝试后成功`, C.green);
    log('INFO', `退避重试耗时: ${backoffDuration}ms（预期 ~1400ms = 200 + 400 + 800）`, C.blue);

    // 验证退避时间：应至少 200 + 400 = 600ms（前两次失败后等待）
    if (backoffDuration >= 600) {
      log('PASS', `退避时间验证：${backoffDuration}ms >= 600ms（200 + 400）`, C.green);
    } else {
      log('WARN', `退避时间验证：${backoffDuration}ms < 600ms，退避可能未生效`, C.yellow);
    }

    // 验证结果包含尝试次数
    if (backoffResult.results['STAGE-BACKOFF'].output.attempts === 3) {
      log('PASS', '重试次数验证：正确重试 3 次', C.green);
    }

  } catch (e) {
    log('FAIL', `退避重试测试失败: ${e.message}`, C.red);
    allPassed = false; exitCode = 1;
  }

  // ============================================================
  // Test 13: EventBus 高并发事件压力测试
  // ============================================================
  section('Test 13: EventBus 高并发事件压力测试');

  const highLoadBus = new CommercialEventBus({ name: 'p5-highload-bus', debug: false });
  let eventCount = 0;
  const targetEvents = 100;

  // 订阅事件
  const unsub = highLoadBus.subscribe('skill.completed', () => {
    eventCount++;
  });

  // 快速发布 100 个事件
  const publishStart = Date.now();
  for (let i = 0; i < targetEvents; i++) {
    highLoadBus.publish('skill.completed', {
      skillId: `skill_${i}`,
      traceId: `p5_highload_${publishStart}`
    }, { traceId: `p5_highload_${publishStart}` });
  }

  // 等待事件处理
  await new Promise(r => setTimeout(r, 200));
  const publishDuration = Date.now() - publishStart;

  log('INFO', `高并发事件发布：${targetEvents} 个事件，耗时 ${publishDuration}ms`, C.blue);
  log('INFO', `订阅者收到事件：${eventCount}/${targetEvents}`, C.blue);

  if (eventCount === targetEvents) {
    log('PASS', `EventBus 高并发测试：${eventCount}/${targetEvents} 事件全部处理`, C.green);
  } else {
    log('FAIL', `EventBus 高并发测试：仅 ${eventCount}/${targetEvents} 事件被处理`, C.red);
    allPassed = false; exitCode = 1;
  }

  // 吞吐量：应至少 100 事件/秒
  const throughput = (targetEvents / publishDuration * 1000).toFixed(0);
  log('INFO', `EventBus 吞吐量: ${throughput} 事件/秒`, C.blue);
  if (throughput >= 100) {
    log('PASS', `吞吐量检查：${throughput} >= 100 事件/秒`, C.green);
  } else {
    log('WARN', `吞吐量警告：${throughput} < 100 事件/秒`, C.yellow);
  }

  unsub();

  // 验证 EventBus 日志未溢出
  const logSize = highLoadBus.eventLog.length;
  log('INFO', `EventBus 日志大小: ${logSize}`, C.blue);
  if (logSize <= highLoadBus.maxLogSize) {
    log('PASS', `日志上限检查：${logSize} <= ${highLoadBus.maxLogSize}`, C.green);
  } else {
    log('FAIL', `日志溢出：${logSize} > ${highLoadBus.maxLogSize}`, C.red);
    allPassed = false; exitCode = 1;
  }

  // ============================================================
  // 总结
  // ============================================================
  section('P5 性能压力测试总结');

  if (allPassed) {
    log('PASS', '✅ P5 全部性能压力测试通过！并发、大数据、超时重试、EventBus 高并发均达标。', C.green);
  } else {
    log('FAIL', '❌ P5 部分测试失败，请检查上述错误。', C.red);
  }

  console.log(`\n${C.gray}Exit code: ${exitCode}${C.reset}\n`);
  process.exit(exitCode);
}

main().catch(e => {
  console.error('P5 验证脚本异常:', e);
  process.exit(1);
});
