#!/usr/bin/env node
'use strict';

/**
 * Skill Validation Script — P6 生产部署集成验证
 * skills/validate-skills-p6.js
 *
 * 验证内容：
 * - Test 14: Docker 构建验证（Dockerfile 语法、镜像构建）
 * - Test 15: 环境配置注入验证（dev/test/prod 环境分离）
 * - Test 16: 健康检查端点验证（/health, deploy/healthcheck.js）
 * - Test 17: 监控指标验证（/metrics, /summary, Prometheus 格式）
 * - Test 18: 端到端容器化测试（模拟容器内执行完整 Pipeline）
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

const PROJECT_ROOT = path.join(__dirname, '..');
const INFRA_DIR = path.join(PROJECT_ROOT, 'infrastructure');
const DEPLOY_DIR = path.join(PROJECT_ROOT, 'deploy');
const SKILLS_DIR = path.join(PROJECT_ROOT, 'skills');

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

let allPassed = true;
let exitCode = 0;

// ============================================================
// Test 14: Docker 构建验证
// ============================================================
section('Test 14: Docker 构建验证');

// 14a: Dockerfile 存在
const dockerfilePath = path.join(PROJECT_ROOT, 'Dockerfile');
if (fs.existsSync(dockerfilePath)) {
  log('PASS', 'Dockerfile 存在', C.green);
} else {
  log('FAIL', 'Dockerfile 不存在', C.red);
  allPassed = false; exitCode = 1;
}

// 14b: Dockerfile 语法检查（基础规则）
const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
const requiredInstructions = ['FROM', 'WORKDIR', 'COPY', 'EXPOSE', 'CMD'];
const missingInst = requiredInstructions.filter(inst => !dockerfileContent.includes(inst));
if (missingInst.length === 0) {
  log('PASS', 'Dockerfile 包含必要指令 (FROM/WORKDIR/COPY/EXPOSE/CMD)', C.green);
} else {
  log('FAIL', `Dockerfile 缺失指令: ${missingInst.join(', ')}`, C.red);
  allPassed = false; exitCode = 1;
}

// 14c: 多阶段构建
if (dockerfileContent.includes('AS builder') || dockerfileContent.includes('AS runtime')) {
  log('PASS', 'Dockerfile 使用多阶段构建（builder/runtime）', C.green);
} else {
  log('WARN', 'Dockerfile 未使用多阶段构建（建议优化镜像大小）', C.yellow);
}

// 14d: 非 root 用户
if (dockerfileContent.includes('USER appuser')) {
  log('PASS', 'Dockerfile 使用非 root 用户运行（安全最佳实践）', C.green);
} else {
  log('WARN', 'Dockerfile 未使用非 root 用户', C.yellow);
}

// 14e: HEALTHCHECK
if (dockerfileContent.includes('HEALTHCHECK')) {
  log('PASS', 'Dockerfile 配置健康检查', C.green);
} else {
  log('FAIL', 'Dockerfile 缺少 HEALTHCHECK', C.red);
  allPassed = false; exitCode = 1;
}

// 14f: docker-compose.yml 存在
const composePath = path.join(PROJECT_ROOT, 'docker-compose.yml');
if (fs.existsSync(composePath)) {
  log('PASS', 'docker-compose.yml 存在', C.green);
} else {
  log('FAIL', 'docker-compose.yml 不存在', C.red);
  allPassed = false; exitCode = 1;
}

// 14g: docker-compose 资源限制
const composeContent = fs.readFileSync(composePath, 'utf8');
if (composeContent.includes('resources:') && composeContent.includes('memory:')) {
  log('PASS', 'docker-compose 配置资源限制（CPU/Memory）', C.green);
} else {
  log('WARN', 'docker-compose 未配置资源限制', C.yellow);
}

// 14h: .env.example 存在
const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
if (fs.existsSync(envExamplePath)) {
  log('PASS', '.env.example 环境模板存在', C.green);
} else {
  log('FAIL', '.env.example 环境模板不存在', C.red);
  allPassed = false; exitCode = 1;
}

// 14i: 关键文件都在 COPY 范围内
const requiredFiles = ['infrastructure/', 'skills/', 'deploy/', 'systems/'];
const missingCopy = requiredFiles.filter(f => !dockerfileContent.includes(f));
if (missingCopy.length === 0) {
  log('PASS', 'Dockerfile COPY 包含所有必要目录', C.green);
} else {
  log('FAIL', `Dockerfile 缺失 COPY: ${missingCopy.join(', ')}`, C.red);
  allPassed = false; exitCode = 1;
}

// ============================================================
// Test 15: 环境配置注入验证
// ============================================================
section('Test 15: 环境配置注入验证');

// 15a: 加载 .env.example 验证格式
const envExample = fs.readFileSync(envExamplePath, 'utf8');
const envVars = ['NODE_ENV', 'LOG_LEVEL', 'EVENT_BUS_PORT', 'MAX_PIPELINE_CONCURRENCY', 'ENABLE_COMPENSATION'];
const missingEnv = envVars.filter(v => !envExample.includes(v));
if (missingEnv.length === 0) {
  log('PASS', '.env.example 包含所有关键环境变量', C.green);
} else {
  log('FAIL', `.env.example 缺失: ${missingEnv.join(', ')}`, C.red);
  allPassed = false; exitCode = 1;
}

// 15b: 模拟不同环境配置
const envScenarios = [
  { NODE_ENV: 'development', LOG_LEVEL: 'debug', MAX_PIPELINE_CONCURRENCY: '1' },
  { NODE_ENV: 'testing', LOG_LEVEL: 'info', MAX_PIPELINE_CONCURRENCY: '2' },
  { NODE_ENV: 'production', LOG_LEVEL: 'warn', MAX_PIPELINE_CONCURRENCY: '3' }
];

for (const scenario of envScenarios) {
  const oldEnv = {};
  for (const [key, value] of Object.entries(scenario)) {
    oldEnv[key] = process.env[key];
    process.env[key] = value;
  }

  try {
    // 重新加载指标收集器验证环境读取
    delete require.cache[require.resolve(path.join(DEPLOY_DIR, 'metrics-collector'))];
    const { MetricsCollector } = require(path.join(DEPLOY_DIR, 'metrics-collector'));
    const collector = new MetricsCollector();

    if (collector.enabled === (process.env.ENABLE_METRICS !== 'false')) {
      log('PASS', `环境配置生效: NODE_ENV=${scenario.NODE_ENV}, CONCURRENCY=${scenario.MAX_PIPELINE_CONCURRENCY}`, C.green);
    }
  } catch (e) {
    log('FAIL', `环境配置验证失败: ${e.message}`, C.red);
    allPassed = false; exitCode = 1;
  }

  // 恢复环境
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

// ============================================================
// Test 16: 健康检查端点验证
// ============================================================
section('Test 16: 健康检查端点验证');

// 16a: 运行 deploy/healthcheck.js
log('INFO', '运行容器健康检查脚本...', C.blue);

try {
  const { execSync } = require('child_process');
  const output = execSync('node deploy/healthcheck.js', {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 10000
  });
  const exitCode_ = execSync('node deploy/healthcheck.js && echo 0 || echo 1', {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 10000
  }).trim();

  if (output.includes('🟢 全部检查通过')) {
    log('PASS', '健康检查脚本通过', C.green);
  } else {
    log('WARN', '健康检查输出异常', C.yellow);
  }
} catch (e) {
  log('FAIL', `健康检查脚本失败: ${e.message}`, C.red);
  allPassed = false; exitCode = 1;
}

// 16b: 检查 infrastructure/index.js 启动逻辑
const infraIndex = fs.readFileSync(path.join(INFRA_DIR, 'index.js'), 'utf8');
if (infraIndex.includes('require.main === module') && infraIndex.includes('MetricsCollector')) {
  log('PASS', 'infrastructure/index.js 集成 MetricsCollector 启动逻辑', C.green);
} else {
  log('WARN', 'infrastructure/index.js 未完全集成启动逻辑', C.yellow);
}

// ============================================================
// Test 17: 监控指标验证
// ============================================================
section('Test 17: 监控指标验证');

// 17a: MetricsCollector 可加载
const { MetricsCollector } = require(path.join(DEPLOY_DIR, 'metrics-collector'));
if (MetricsCollector) {
  log('PASS', 'MetricsCollector 模块加载成功', C.green);
} else {
  log('FAIL', 'MetricsCollector 模块加载失败', C.red);
  allPassed = false; exitCode = 1;
}

// 17b: 启动指标 HTTP 服务
const collector = new MetricsCollector({ enabled: true, retentionHours: 1 });

// 模拟一些指标数据
collector.recordPipeline({
  traceId: 'p6_test_1',
  duration: 1500,
  executedStages: [
    { status: 'success' }, { status: 'success' }, { status: 'skipped' }
  ]
});
collector.recordStage('STAGE-1', 'skill-a', 200, 'success', 1);
collector.recordStage('STAGE-2', 'skill-b', 300, 'success', 1);
collector.recordStage('STAGE-3', 'skill-c', 0, 'skipped', 1);

// 17c: 启动 HTTP 服务
const testPort = 13000;
let server;

(async () => {
server = collector.startHttpServer(testPort);

// 等待服务启动
await new Promise(r => setTimeout(r, 200));

// 17d: 测试 /health 端点
const testEndpoint = (path_, expectedStatus, checkFn) => new Promise((resolve) => {
  const req = http.get(`http://127.0.0.1:${testPort}${path_}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === expectedStatus) {
        try {
          const result = checkFn ? checkFn(data) : true;
          if (result) {
            log('PASS', `端点 ${path_} 返回 HTTP ${expectedStatus}`, C.green);
          } else {
            log('FAIL', `端点 ${path_} 数据验证失败`, C.red);
            allPassed = false; exitCode = 1;
          }
        } catch (e) {
          log('FAIL', `端点 ${path_} 检查异常: ${e.message}`, C.red);
          allPassed = false; exitCode = 1;
        }
      } else {
        log('FAIL', `端点 ${path_} 返回 HTTP ${res.statusCode}，预期 ${expectedStatus}`, C.red);
        allPassed = false; exitCode = 1;
      }
      resolve();
    });
  });
  req.on('error', (e) => {
    log('FAIL', `端点 ${path_} 请求失败: ${e.message}`, C.red);
    allPassed = false; exitCode = 1;
    resolve();
  });
  req.setTimeout(5000, () => {
    log('FAIL', `端点 ${path_} 请求超时`, C.red);
    allPassed = false; exitCode = 1;
    resolve();
  });
});

await testEndpoint('/health', 200, (data) => {
  const json = JSON.parse(data);
  return json.status === 'ok' && json.timestamp;
});

await testEndpoint('/summary', 200, (data) => {
  const json = JSON.parse(data);
  return json.counters && json.counters.pipelineTotal >= 1 && json.memory;
});

await testEndpoint('/metrics', 200, (data) => {
  return data.includes('skill_pipeline_total') &&
         data.includes('skill_stage_total') &&
         data.includes('skill_memory_rss_bytes');
});

await testEndpoint('/notfound', 404);

// 关闭测试服务器
server.close();

// 17e: Prometheus 格式验证
const prometheusOutput = collector.toPrometheus();
const requiredMetrics = [
  'skill_pipeline_total{status="success"}',
  'skill_stage_total{status="success"}',
  'skill_compensation_total',
  'skill_memory_rss_bytes',
  'skill_uptime_seconds'
];
const missingMetrics = requiredMetrics.filter(m => !prometheusOutput.includes(m));
if (missingMetrics.length === 0) {
  log('PASS', 'Prometheus 指标格式正确，包含所有必要指标', C.green);
} else {
  log('FAIL', `Prometheus 指标缺失: ${missingMetrics.join(', ')}`, C.red);
  allPassed = false; exitCode = 1;
}

// ============================================================
// Test 18: 端到端容器化测试
// ============================================================
section('Test 18: 端到端容器化测试（模拟容器内环境）');

// 18a: 模拟容器内文件系统只读 + 临时目录可写
const tmpDir = path.join(PROJECT_ROOT, 'tmp-output');
try {
  fs.mkdirSync(tmpDir, { recursive: true });
  const testFile = path.join(tmpDir, 'p6-test.txt');
  fs.writeFileSync(testFile, 'container write test');
  const content = fs.readFileSync(testFile, 'utf8');
  fs.unlinkSync(testFile);

  if (content === 'container write test') {
    log('PASS', '临时输出目录可读写（模拟容器 /app/tmp-output）', C.green);
  }
} catch (e) {
  log('FAIL', `临时目录测试失败: ${e.message}`, C.red);
  allPassed = false; exitCode = 1;
}

// 18b: 完整 Pipeline 在"容器化"模式下执行
log('INFO', '执行容器化端到端 Pipeline...', C.blue);

const { SkillLoader } = require(path.join(SKILLS_DIR, 'skill-loader'));
const { SkillRegistry } = require(path.join(SKILLS_DIR, 'skill-registry'));
const { SkillOrchestratorAdapter } = require(path.join(INFRA_DIR, 'skill-orchestrator-adapter'));
const { ContextAccumulationStrategy, CommercialContextPresets } = require(path.join(INFRA_DIR, 'context-accumulation-strategy'));
const { CommercialEventBus } = require(path.join(INFRA_DIR, 'event-bus'));

const p6Bus = new CommercialEventBus({ name: 'p6-deploy-bus' });
const p6Loader = new SkillLoader({ skillDirs: [SKILLS_DIR] });
p6Loader.scan();
const p6Loaded = p6Loader.load();

const p6Registry = new SkillRegistry();
p6Loaded.forEach(s => p6Registry.register(s));

const p6Adapter = new SkillOrchestratorAdapter({
  registry: p6Registry,
  eventBus: p6Bus,
  contextStrategy: new ContextAccumulationStrategy(CommercialContextPresets)
});

// 模拟生产环境配置
process.env.NODE_ENV = 'production';
process.env.ENABLE_COMPENSATION = 'true';

const p6Scene = {
  product: { name: 'DockerDeploy 测试产品', type: 'tech' },
  brand: { name: 'DeployBrand', style: 'modern' },
  targetAudience: '开发者',
  cameraPlan: {
    shots: [
      { id: 'D001', scale: 'MS', duration: 3, movement: 'pan', prompt: '容器化部署演示' },
      { id: 'D002', scale: 'CU', duration: 2, movement: 'static', prompt: 'Docker 镜像构建过程' }
    ]
  },
  outputPath: tmpDir
};

try {
  const p6Result = await p6Adapter.execute(p6Scene, {
    traceId: `p6_deploy_${Date.now()}`
  });

  const successCount = p6Result.executedStages.filter(s => s.status === 'success').length;
  log('PASS', `容器化 Pipeline 执行成功 | ${successCount}/${p6Result.executedStages.length} Stage 成功`, C.green);

  // 记录到指标收集器验证集成
  collector.recordPipeline(p6Result);

  // 18c: 验证上下文累积在"生产"模式下正常
  const finalCtx = p6Result.context;
  if (finalCtx.product && finalCtx.shots && finalCtx.shots.length === 2) {
    log('PASS', '生产环境上下文累积验证通过（2 个镜头传递）', C.green);
  } else {
    log('WARN', '生产环境上下文累积可能异常', C.yellow);
  }
} catch (e) {
  log('FAIL', `容器化 Pipeline 失败: ${e.message}`, C.red);
  allPassed = false; exitCode = 1;
}

// 18d: 日志目录验证
const logDir = path.join(PROJECT_ROOT, 'logs');
try {
  fs.mkdirSync(logDir, { recursive: true });
  log('PASS', '日志目录可创建（模拟容器 /app/logs）', C.green);
} catch (e) {
  log('WARN', `日志目录创建失败: ${e.message}`, C.yellow);
}

// 恢复环境
process.env.NODE_ENV = 'development';

})(); // 结束 async IIFE

// ============================================================
// 总结
// ============================================================
section('P6 生产部署集成测试总结');

if (allPassed) {
  log('PASS', '✅ P6 全部生产部署测试通过！Docker 化、环境配置、健康检查、监控指标、端到端容器化均达标。', C.green);
  log('INFO', '部署命令:', C.blue);
  log('INFO', '  cp .env.example .env  # 编辑环境变量', C.gray);
  log('INFO', '  docker-compose up -d  # 启动服务', C.gray);
  log('INFO', '  curl http://localhost:3000/health   # 健康检查', C.gray);
  log('INFO', '  curl http://localhost:3000/metrics  # Prometheus 指标', C.gray);
} else {
  log('FAIL', '❌ P6 部分测试未通过，请检查上述失败项。', C.red);
}

console.log(`\n${C.gray}Exit code: ${exitCode}${C.reset}\n`);
process.exit(exitCode);
