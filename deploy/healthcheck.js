#!/usr/bin/env node
'use strict';

/**
 * 容器健康检查脚本
 * deploy/healthcheck.js
 *
 * 被 Dockerfile HEALTHCHECK 和 docker-compose 调用。
 * 检查：
 * 1. Node.js 进程存活
 * 2. 核心模块可加载
 * 3. Skill 系统可初始化
 *
 * 返回 0 = 健康，1 = 不健康
 */

const path = require('path');
const fs = require('fs');

const INFRA_DIR = path.join(__dirname, '..', 'infrastructure');
const SKILLS_DIR = path.join(__dirname, '..', 'skills');

const CHECKS = {
  nodeVersion: false,
  infraModules: false,
  skillBase: false,
  skillCount: false,
  memoryOK: false
};

function fail(reason) {
  console.error(`[HEALTHCHECK] ❌ ${reason}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`[HEALTHCHECK] ✅ ${msg}`);
}

// ---- Check 1: Node.js 版本 ----
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (major >= 18) {
  CHECKS.nodeVersion = true;
  pass(`Node.js ${nodeVersion}`);
} else {
  fail(`Node.js 版本过低: ${nodeVersion}，需要 >= 18`);
}

// ---- Check 2: 核心基础设施模块可加载 ----
try {
  const saga = require(path.join(INFRA_DIR, 'saga-orchestrator'));
  const bus = require(path.join(INFRA_DIR, 'event-bus'));
  const adapter = require(path.join(INFRA_DIR, 'skill-orchestrator-adapter'));
  const ctx = require(path.join(INFRA_DIR, 'context-accumulation-strategy'));

  if (saga.CommercialSagaOrchestrator && bus.CommercialEventBus &&
      adapter.SkillOrchestratorAdapter && ctx.ContextAccumulationStrategy) {
    CHECKS.infraModules = true;
    pass('核心基础设施模块加载成功 (4/4)');
  } else {
    fail('核心模块导出不完整');
  }
} catch (e) {
  fail(`核心模块加载失败: ${e.message}`);
}

// ---- Check 3: SkillBase 可加载 ----
try {
  const baseModule = require(path.join(SKILLS_DIR, 'skill-base'));
  const SkillBase = baseModule.SkillBase;
  if (typeof SkillBase === 'function') {
    CHECKS.skillBase = true;
    pass('SkillBase 基类加载成功');
  } else {
    fail('SkillBase 不是构造函数');
  }
} catch (e) {
  fail(`SkillBase 加载失败: ${e.message}`);
}

// ---- Check 4: 6 个 Skill 目录存在 ----
const requiredSkills = [
  'cinematic-camera-skill',
  'commercial-mode-skill',
  'continuity-engine-skill',
  'post-production-skill',
  'prompt-guardian-skill',
  'render-pipeline-guard-skill'
];
const missing = requiredSkills.filter(s => !fs.existsSync(path.join(SKILLS_DIR, s)));
if (missing.length === 0) {
  CHECKS.skillCount = true;
  pass(`6 个 Skill 目录全部存在`);
} else {
  fail(`缺失 Skill 目录: ${missing.join(', ')}`);
}

// ---- Check 5: 内存使用率 ----
const mem = process.memoryUsage();
const rssMB = (mem.rss / 1024 / 1024).toFixed(1);
if (mem.rss < 512 * 1024 * 1024) { // < 512MB
  CHECKS.memoryOK = true;
  pass(`内存使用正常: RSS ${rssMB}MB`);
} else {
  fail(`内存使用过高: RSS ${rssMB}MB`);
}

// ---- 汇总 ----
const allPassed = Object.values(CHECKS).every(v => v === true);
if (allPassed) {
  console.log('[HEALTHCHECK] 🟢 全部检查通过，服务健康');
  process.exit(0);
} else {
  const failed = Object.entries(CHECKS).filter(([_, v]) => !v).map(([k]) => k);
  fail(`部分检查未通过: ${failed.join(', ')}`);
}
