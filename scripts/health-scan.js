#!/usr/bin/env node
/**
 * 卓越系统全盘健康扫描
 * 检查项：内存泄漏、事件监听器、未使用变量、错误处理、资源泄漏
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ZHUOYUE_DIR = path.resolve(__dirname, '..');
const REPORT = {
  timestamp: new Date().toISOString(),
  version: fs.readFileSync(path.join(ZHUOYUE_DIR, '.current-version'), 'utf8').trim(),
  checks: {},
  issues: [],
  summary: { passed: 0, failed: 0, warnings: 0 }
};

// ============================================================
// 工具函数
// ============================================================

function log(level, message) {
  const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'PASS' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${level}] ${message}`);
}

function addIssue(severity, category, message, file = null, line = null) {
  REPORT.issues.push({ severity, category, message, file, line });
  if (severity === 'ERROR') REPORT.summary.failed++;
  else if (severity === 'WARN') REPORT.summary.warnings++;
  else REPORT.summary.passed++;
}

// ============================================================
// 检查项
// ============================================================

async function checkMemoryLeaks() {
  log('INFO', '=== 内存泄漏检查 ===');
  
  // 检查1: EventEmitter监听器泄漏
  const emitterFiles = execSync(
    `grep -rn "new EventEmitter\|extends EventEmitter" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems ${ZHUOYUE_DIR}/engines 2>/dev/null || true`,
    { encoding: 'utf8' }
  );
  
  if (emitterFiles.trim()) {
    const files = emitterFiles.split('\n').filter(Boolean);
    log('WARN', `发现 ${files.length} 个文件使用EventEmitter`);
    
    // 检查是否设置了maxListeners
    const maxListenersSet = execSync(
      `grep -rn "setMaxListeners" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems ${ZHUOYUE_DIR}/engines 2>/dev/null || true`,
      { encoding: 'utf8' }
    );
    
    if (!maxListenersSet.trim()) {
      addIssue('WARN', 'MEMORY', 'EventEmitter未设置maxListeners上限，可能导致内存泄漏', null, null);
    }
  }
  
  // 检查2: 全局变量
  const globalVars = execSync(
    `grep -rn "^[a-zA-Z_][a-zA-Z0-9_]* *= *" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems ${ZHUOYUE_DIR}/engines 2>/dev/null | grep -v "const \\|let \\|var " | head -20 || true`,
    { encoding: 'utf8' }
  );
  
  if (globalVars.trim()) {
    addIssue('WARN', 'MEMORY', `发现潜在全局变量赋值`, null, null);
  }
  
  log('PASS', '内存泄漏基础检查完成');
}

async function checkEventListeners() {
  log('INFO', '=== 事件监听器检查 ===');
  
  // 检查.on()和.removeListener()是否成对出现
  const onListeners = execSync(
    `grep -rn "\\.on(" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems ${ZHUOYUE_DIR}/engines 2>/dev/null | wc -l`,
    { encoding: 'utf8' }
  ).trim();
  
  const removeListeners = execSync(
    `grep -rn "removeListener\\|removeAllListeners" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems ${ZHUOYUE_DIR}/engines 2>/dev/null | wc -l`,
    { encoding: 'utf8' }
  ).trim();
  
  const onCount = parseInt(onListeners) || 0;
  const removeCount = parseInt(removeListeners) || 0;
  
  log('INFO', `监听器注册: ${onCount}次, 监听器移除: ${removeCount}次`);
  
  if (onCount > removeCount * 2) {
    addIssue('WARN', 'EVENTS', `监听器注册(${onCount})远大于移除(${removeCount})，可能存在泄漏`, null, null);
  }
  
  log('PASS', '事件监听器检查完成');
}

async function checkErrorHandling() {
  log('INFO', '=== 错误处理完整性检查 ===');
  
  // 检查1: Promise链缺少catch
  const promisesWithoutCatch = execSync(
    `grep -rn "\.then(" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems 2>/dev/null | grep -v "catch" | head -20 || true`,
    { encoding: 'utf8' }
  );
  
  if (promisesWithoutCatch.trim()) {
    addIssue('WARN', 'ERRORS', '部分Promise链缺少catch处理', null, null);
  }
  
  // 检查2: async函数未包裹try-catch
  const asyncFunctions = execSync(
    `grep -rn "async function" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems 2>/dev/null | wc -l`,
    { encoding: 'utf8' }
  ).trim();
  
  const tryBlocks = execSync(
    `grep -rn "try {" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems 2>/dev/null | wc -l`,
    { encoding: 'utf8' }
  ).trim();
  
  log('INFO', `async函数: ${asyncFunctions}个, try块: ${tryBlocks}个`);
  
  if (parseInt(tryBlocks) < parseInt(asyncFunctions) * 0.5) {
    addIssue('WARN', 'ERRORS', `try-catch覆盖率偏低，建议增加错误处理`, null, null);
  }
  
  log('PASS', '错误处理检查完成');
}

async function checkResourceLeaks() {
  log('INFO', '=== 资源泄漏检查 ===');
  
  // 检查1: 文件句柄是否关闭
  const fsOpen = execSync(
    `grep -rn "fs\.open\\|fs\.openSync" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems 2>/dev/null | wc -l`,
    { encoding: 'utf8' }
  ).trim();
  
  const fsClose = execSync(
    `grep -rn "fs\.close\\|fs\.closeSync" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems 2>/dev/null | wc -l`,
    { encoding: 'utf8' }
  ).trim();
  
  log('INFO', `文件打开: ${fsOpen}次, 文件关闭: ${fsClose}次`);
  
  if (parseInt(fsOpen) > parseInt(fsClose)) {
    addIssue('WARN', 'RESOURCES', `文件打开(${fsOpen})多于关闭(${fsClose})，可能泄漏`, null, null);
  }
  
  // 检查2: 定时器清理
  const setIntervals = execSync(
    `grep -rn "setInterval" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems 2>/dev/null | wc -l`,
    { encoding: 'utf8' }
  ).trim();
  
  const clearIntervals = execSync(
    `grep -rn "clearInterval" --include="*.js" ${ZHUOYUE_DIR}/core ${ZHUOYUE_DIR}/systems 2>/dev/null | wc -l`,
    { encoding: 'utf8' }
  ).trim();
  
  log('INFO', `setInterval: ${setIntervals}个, clearInterval: ${clearIntervals}个`);
  
  if (parseInt(setIntervals) > parseInt(clearIntervals)) {
    addIssue('WARN', 'RESOURCES', `定时器创建(${setIntervals})多于清理(${clearIntervals})，可能泄漏`, null, null);
  }
  
  log('PASS', '资源泄漏检查完成');
}

async function checkProcessHealth() {
  log('INFO', '=== 进程健康检查 ===');
  
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  
  log('INFO', `当前内存使用: RSS=${rssMB}MB, Heap=${heapUsedMB}MB`);
  
  if (heapUsedMB > 512) {
    addIssue('WARN', 'PROCESS', `堆内存使用较高: ${heapUsedMB}MB`, null, null);
  }
  
  if (rssMB > 1024) {
    addIssue('WARN', 'PROCESS', `RSS内存使用较高: ${rssMB}MB`, null, null);
  }
  
  log('PASS', '进程健康检查完成');
}

async function checkSystemDependencies() {
  log('INFO', '=== 系统依赖检查 ===');
  
  // 检查关键环境变量
  const requiredEnv = ['KIMI_API_KEY', 'MOONSHOT_API_KEY', 'VOLCENGINE_ARK_API_KEY'];
  const missing = requiredEnv.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    addIssue('WARN', 'DEPENDENCIES', `缺少环境变量: ${missing.join(', ')}`, null, null);
  } else {
    log('PASS', '所有关键环境变量已配置');
  }
  
  // 检查node_modules
  const nodeModules = path.join(ZHUOYUE_DIR, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    addIssue('ERROR', 'DEPENDENCIES', 'node_modules目录不存在，请运行npm install', null, null);
  }
  
  log('PASS', '系统依赖检查完成');
}

async function checkFileIntegrity() {
  log('INFO', '=== 文件完整性检查 ===');
  
  // 检查关键文件是否存在
  const criticalFiles = [
    'core/nirath-master-pipeline.js',
    'systems/llm-reasoning-engine.js',
    'utils/circuit-breaker.js',
    'utils/retry-policy.js',
    '.current-version'
  ];
  
  for (const file of criticalFiles) {
    const fullPath = path.join(ZHUOYUE_DIR, file);
    if (!fs.existsSync(fullPath)) {
      addIssue('ERROR', 'INTEGRITY', `关键文件缺失: ${file}`, file, null);
    }
  }
  
  log('PASS', '文件完整性检查完成');
}

// ============================================================
// 主函数
// ============================================================

async function runHealthScan() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     卓越系统全盘健康扫描 v6.6.17           ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log();
  
  await checkMemoryLeaks();
  console.log();
  
  await checkEventListeners();
  console.log();
  
  await checkErrorHandling();
  console.log();
  
  await checkResourceLeaks();
  console.log();
  
  await checkProcessHealth();
  console.log();
  
  await checkSystemDependencies();
  console.log();
  
  await checkFileIntegrity();
  console.log();
  
  // 生成报告
  console.log('╔════════════════════════════════════════════╗');
  console.log('║              扫描报告                      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`通过: ${REPORT.summary.passed} | 警告: ${REPORT.summary.warnings} | 错误: ${REPORT.summary.failed}`);
  console.log();
  
  if (REPORT.issues.length > 0) {
    console.log('发现的问题:');
    REPORT.issues.forEach((issue, i) => {
      const icon = issue.severity === 'ERROR' ? '❌' : '⚠️';
      console.log(`  ${icon} [${issue.category}] ${issue.message}`);
      if (issue.file) console.log(`     文件: ${issue.file}`);
    });
  } else {
    console.log('✅ 所有检查项通过，系统健康！');
  }
  
  // 保存报告
  const reportPath = path.join(ZHUOYUE_DIR, 'health-scan-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(REPORT, null, 2));
  console.log(`\n📄 报告已保存: ${reportPath}`);
}

runHealthScan().catch(err => {
  console.error('扫描失败:', err);
  process.exit(1);
});
